use clap::{Args, Parser, Subcommand, ValueEnum};
use env_contract_check::{
    CheckOptions, DiffState, Profile, Report, Severity, check, parse_contract,
};
use std::fs;
use std::path::PathBuf;
use std::process::ExitCode;

#[derive(Parser)]
#[command(
    name = "env-contract-check",
    version,
    about = "Validate what a .env file means before your runtime reads it",
    long_about = "Validate typed environment contracts using Node, Python, or Docker parser semantics. Runs offline and never prints environment values."
)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Validate an environment file and optionally compare a baseline
    Check(CheckArgs),
}

#[derive(Args)]
struct CheckArgs {
    /// Typed TOML contract to enforce
    #[arg(short, long, value_name = "FILE", default_value = "env.contract.toml")]
    contract: PathBuf,

    /// Environment file to validate
    #[arg(short = 'e', long = "env", value_name = "FILE", default_value = ".env")]
    env_file: PathBuf,

    /// Parser semantics used by the target runtime
    #[arg(short, long, value_enum, default_value = "node")]
    profile: ProfileArg,

    /// Compare against another .env file without exposing values
    #[arg(short, long, value_name = "FILE")]
    baseline: Option<PathBuf>,

    /// Emit stable JSON for CI and editor tooling
    #[arg(long)]
    json: bool,

    /// Treat keys absent from the contract as errors
    #[arg(long)]
    deny_unused: bool,

    /// Return exit 1 when any warning is reported
    #[arg(long)]
    deny_warnings: bool,
}

#[derive(Clone, Copy, ValueEnum)]
enum ProfileArg {
    Node,
    Python,
    Docker,
}

impl From<ProfileArg> for Profile {
    fn from(value: ProfileArg) -> Self {
        match value {
            ProfileArg::Node => Self::Node,
            ProfileArg::Python => Self::Python,
            ProfileArg::Docker => Self::Docker,
        }
    }
}

fn main() -> ExitCode {
    match run(Cli::parse()) {
        Ok(true) => ExitCode::SUCCESS,
        Ok(false) => ExitCode::from(1),
        Err(message) => {
            eprintln!("env-contract-check: {message}");
            ExitCode::from(2)
        }
    }
}

fn run(cli: Cli) -> Result<bool, String> {
    let Command::Check(args) = cli.command;
    let contract_source = read(&args.contract, "contract")?;
    let contract = parse_contract(&contract_source)?;
    let current = read(&args.env_file, "environment file")?;
    let baseline = args
        .baseline
        .as_ref()
        .map(|path| read(path, "baseline environment file"))
        .transpose()?;
    let report = check(
        &contract,
        &current,
        baseline.as_deref(),
        args.profile.into(),
        CheckOptions {
            deny_unused: args.deny_unused,
            deny_warnings: args.deny_warnings,
        },
    );
    if args.json {
        println!(
            "{}",
            serde_json::to_string_pretty(&report).map_err(|e| e.to_string())?
        );
    } else {
        print_human(&report);
    }
    Ok(report.ok)
}

fn read(path: &PathBuf, label: &str) -> Result<String, String> {
    fs::read_to_string(path)
        .map_err(|error| format!("could not read {label} {}: {error}", path.display()))
}

fn print_human(report: &Report) {
    println!("Env Contract Check · {} profile", report.profile.as_str());
    println!("{}", "─".repeat(48));
    if report.diagnostics.is_empty() {
        println!(
            "PASS  {} contract keys checked; no findings",
            report.summary.checked
        );
    } else {
        for item in &report.diagnostics {
            let marker = match item.severity {
                Severity::Error => "ERROR",
                Severity::Warning => "WARN ",
            };
            let location = match (&item.key, item.line) {
                (Some(key), Some(line)) => format!("{}:{line} {key}", item.source),
                (Some(key), None) => format!("{} {key}", item.source),
                (None, Some(line)) => format!("{}:{line}", item.source),
                (None, None) => item.source.to_owned(),
            };
            println!("{marker} [{:<26}] {location} — {}", item.code, item.message);
        }
    }
    if !report.comparison.is_empty() {
        println!();
        println!("Redacted comparison (values never shown)");
        for entry in &report.comparison {
            let state = match entry.state {
                DiffState::Unchanged => "unchanged",
                DiffState::Changed => "changed",
                DiffState::OnlyInCurrent => "only in current",
                DiffState::OnlyInBaseline => "only in baseline",
            };
            let marker = if entry.secret { "secret" } else { "value" };
            println!("  {:<24} {:<17} ({marker})", entry.key, state);
        }
    }
    println!();
    println!(
        "Result: {} · {} error(s), {} warning(s)",
        if report.ok { "PASS" } else { "FAIL" },
        report.summary.errors,
        report.summary.warnings
    );
}
