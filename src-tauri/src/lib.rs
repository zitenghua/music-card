use base64::Engine;
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

fn get_exe_dir() -> PathBuf {
    let exe = std::env::current_exe().unwrap_or_else(|_| PathBuf::from("."));
    exe.parent().map(|p| p.to_path_buf()).unwrap_or(PathBuf::from("."))
}

fn ensure_covers(app: &tauri::App) {
    let exe_covers = get_exe_dir().join("covers");
    if !exe_covers.exists() {
        // 首次启动：从资源目录复制默认封面到 exe 同级
        if let Ok(resource_dir) = app.path().resource_dir() {
            let src = resource_dir.join("covers");
            if src.exists() {
                fs::create_dir_all(&exe_covers).ok();
                for entry in fs::read_dir(&src).unwrap() {
                    if let Ok(entry) = entry {
                        fs::copy(entry.path(), exe_covers.join(entry.file_name())).ok();
                    }
                }
            }
        }
    }
}

#[derive(Serialize)]
pub struct CoverFileResult {
    data_url: String,
    file_name: String,
}

#[tauri::command]
fn select_cover_file(app: tauri::AppHandle) -> Result<CoverFileResult, String> {
    let covers_dir = get_exe_dir().join("covers");
    let _ = fs::create_dir_all(&covers_dir);

    let result = app.dialog()
        .file()
        .set_title("选择封面图片")
        .add_filter("图片", &["png", "jpg", "jpeg", "webp", "gif"])
        .set_directory(&covers_dir)
        .blocking_pick_file();

    match result {
        Some(file_path) => {
            let path = file_path.as_path().ok_or("无效的文件路径")?;
            let data = fs::read(path).map_err(|e| e.to_string())?;
            let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("png").to_lowercase();
            let mime = match ext.as_str() {
                "png" => "image/png", "jpg" | "jpeg" => "image/jpeg",
                "webp" => "image/webp", "gif" => "image/gif", _ => "image/png",
            };
            let b64 = base64::engine::general_purpose::STANDARD.encode(&data);
            let data_url = format!("data:{};base64,{}", mime, b64);
            let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("unknown").to_string();
            Ok(CoverFileResult { data_url, file_name })
        }
        None => Ok(CoverFileResult { data_url: String::new(), file_name: String::new() }),
    }
}

#[tauri::command]
fn export_config_file(app: tauri::AppHandle, file_name: String, content: String) -> Result<bool, String> {
    let configs_dir = get_exe_dir().join("configs");
    let _ = fs::create_dir_all(&configs_dir);

    let result = app.dialog()
        .file()
        .set_title("导出配置")
        .add_filter("JSON 配置", &["json"])
        .set_file_name(&file_name)
        .set_directory(&configs_dir)
        .blocking_save_file();

    match result {
        Some(file_path) => {
            let path = file_path.as_path().ok_or("无效的文件路径")?;
            fs::write(path, &content).map_err(|e| e.to_string())?;
            Ok(true)
        }
        None => Ok(false),
    }
}

#[tauri::command]
fn import_config_file(app: tauri::AppHandle) -> Result<String, String> {
    let configs_dir = get_exe_dir().join("configs");
    let _ = fs::create_dir_all(&configs_dir);

    let result = app.dialog()
        .file()
        .set_title("导入配置")
        .add_filter("JSON 配置", &["json"])
        .set_directory(&configs_dir)
        .blocking_pick_file();

    match result {
        Some(file_path) => {
            let path = file_path.as_path().ok_or("无效的文件路径")?;
            let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
            Ok(content)
        }
        None => Ok(String::new()),
    }
}

#[tauri::command]
fn export_png_file(app: tauri::AppHandle, data_url: String, file_name: String) -> Result<bool, String> {
    let output_dir = get_exe_dir().join("output");
    let _ = fs::create_dir_all(&output_dir);

    let result = app.dialog()
        .file()
        .set_title("导出 PNG")
        .add_filter("PNG 图片", &["png"])
        .set_file_name(&file_name)
        .set_directory(&output_dir)
        .blocking_save_file();

    match result {
        Some(file_path) => {
            let path = file_path.as_path().ok_or("无效的文件路径")?;
            let b64_str = data_url.strip_prefix("data:image/png;base64,").ok_or("无效的 data URL 格式")?;
            let decoded = base64::engine::general_purpose::STANDARD.decode(b64_str).map_err(|e| e.to_string())?;
            fs::write(path, &decoded).map_err(|e| e.to_string())?;
            Ok(true)
        }
        None => Ok(false),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            select_cover_file,
            export_config_file,
            import_config_file,
            export_png_file,
        ])
        .setup(|app| {
            // 首次启动：复制默认封面到 exe 同级 covers/ 目录
            ensure_covers(app);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
