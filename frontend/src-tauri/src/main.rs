// Prevents additional console window on Windows in release, DO NOT REMOVE.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;

fn main() {
    let state = db::AppState::new().expect("failed to initialise the local database");

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            db::login,
            db::logout,
            db::current_user,
            db::list_roles,
            db::list_records,
            db::get_record,
            db::create_record,
            db::update_record,
            db::delete_record,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
