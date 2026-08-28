use std::fs;
use std::process::Command;

#[test]
fn documented_json_example_runs_without_disclosing_secret() {
    let temp = tempfile::tempdir().unwrap();
    let contract = temp.path().join("env.contract.toml");
    let env = temp.path().join("app.env");
    fs::write(
        &contract,
        r#"version = 1
[variables.APP_PORT]
type = "integer"
required = true
[variables.API_TOKEN]
secret = true
required = true
"#,
    )
    .unwrap();
    fs::write(&env, "APP_PORT=nope\nAPI_TOKEN=do-not-print-this").unwrap();

    let output = Command::new(env!("CARGO_BIN_EXE_env-contract-check"))
        .args(["check", "--contract"])
        .arg(&contract)
        .args(["--env"])
        .arg(&env)
        .arg("--json")
        .output()
        .unwrap();

    assert_eq!(output.status.code(), Some(1));
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(stdout.contains("invalid_type"));
    assert!(!stdout.contains("do-not-print-this"));
}

#[test]
fn unreadable_input_uses_exit_two() {
    let output = Command::new(env!("CARGO_BIN_EXE_env-contract-check"))
        .args(["check", "--contract", "does-not-exist.toml"])
        .output()
        .unwrap();
    assert_eq!(output.status.code(), Some(2));
}
