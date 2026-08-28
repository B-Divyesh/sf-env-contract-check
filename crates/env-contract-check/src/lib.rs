//! Parser-aware `.env` contract validation.
//!
//! The library intentionally exposes a small surface: deserialize a [`Contract`],
//! then call [`check`]. Values stay inside [`CheckResult`] only long enough to
//! compare hashes; serialized and human-facing results contain no values.

use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
use std::str::FromStr;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Profile {
    Node,
    Python,
    Docker,
}

impl Profile {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Node => "node",
            Self::Python => "python",
            Self::Docker => "docker",
        }
    }
}

impl FromStr for Profile {
    type Err = String;

    fn from_str(input: &str) -> Result<Self, Self::Err> {
        match input.to_ascii_lowercase().as_str() {
            "node" => Ok(Self::Node),
            "python" => Ok(Self::Python),
            "docker" => Ok(Self::Docker),
            _ => Err(format!(
                "unknown profile {input:?}; expected node, python, or docker"
            )),
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Contract {
    pub version: u32,
    pub variables: BTreeMap<String, VariableRule>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct VariableRule {
    #[serde(default, rename = "type")]
    pub kind: ValueType,
    #[serde(default)]
    pub required: bool,
    #[serde(default)]
    pub secret: bool,
    #[serde(default)]
    pub allow_empty: bool,
    pub allowed: Option<Vec<String>>,
    pub min: Option<f64>,
    pub max: Option<f64>,
}

#[derive(Debug, Default, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ValueType {
    #[default]
    String,
    Integer,
    Number,
    Boolean,
    Url,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    Error,
    Warning,
}

#[derive(Debug, Serialize)]
pub struct Diagnostic {
    pub severity: Severity,
    pub code: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line: Option<usize>,
    pub source: &'static str,
    pub message: String,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DiffState {
    Unchanged,
    Changed,
    OnlyInCurrent,
    OnlyInBaseline,
}

#[derive(Debug, Serialize)]
pub struct DiffEntry {
    pub key: String,
    pub state: DiffState,
    pub secret: bool,
}

#[derive(Debug, Serialize)]
pub struct Summary {
    pub errors: usize,
    pub warnings: usize,
    pub checked: usize,
}

#[derive(Debug, Serialize)]
pub struct Report {
    pub ok: bool,
    pub profile: Profile,
    pub summary: Summary,
    pub diagnostics: Vec<Diagnostic>,
    pub comparison: Vec<DiffEntry>,
}

#[derive(Debug, Clone, Copy, Default)]
pub struct CheckOptions {
    pub deny_unused: bool,
    pub deny_warnings: bool,
}

#[derive(Debug)]
struct ParsedValue {
    value: String,
    line: usize,
}

#[derive(Debug)]
struct ParsedEnv {
    values: BTreeMap<String, ParsedValue>,
    diagnostics: Vec<Diagnostic>,
}

pub fn parse_contract(source: &str) -> Result<Contract, String> {
    let contract: Contract =
        toml::from_str(source).map_err(|error| format!("contract is not valid TOML: {error}"))?;
    validate_contract_shape(&contract)?;
    Ok(contract)
}

pub fn check(
    contract: &Contract,
    current: &str,
    baseline: Option<&str>,
    profile: Profile,
    options: CheckOptions,
) -> Report {
    let mut current = parse_env(current, profile, "current");
    validate_values(contract, &current.values, options, &mut current.diagnostics);

    let mut comparison = Vec::new();
    if let Some(baseline_source) = baseline {
        let baseline = parse_env(baseline_source, profile, "baseline");
        current.diagnostics.extend(baseline.diagnostics);
        comparison = compare(contract, &current.values, &baseline.values);
    }

    current.diagnostics.sort_by(|a, b| {
        (a.line.unwrap_or(usize::MAX), &a.key, a.code).cmp(&(
            b.line.unwrap_or(usize::MAX),
            &b.key,
            b.code,
        ))
    });
    let errors = current
        .diagnostics
        .iter()
        .filter(|item| item.severity == Severity::Error)
        .count();
    let warnings = current.diagnostics.len() - errors;
    let ok = errors == 0 && !(options.deny_warnings && warnings > 0);

    Report {
        ok,
        profile,
        summary: Summary {
            errors,
            warnings,
            checked: contract.variables.len(),
        },
        diagnostics: current.diagnostics,
        comparison,
    }
}

fn validate_contract_shape(contract: &Contract) -> Result<(), String> {
    if contract.version != 1 {
        return Err(format!(
            "unsupported contract version {}; this release supports version 1",
            contract.version
        ));
    }
    if contract.variables.is_empty() {
        return Err("contract must define at least one variable".into());
    }
    for (key, rule) in &contract.variables {
        if !valid_key(key) {
            return Err(format!(
                "contract key {key:?} is not a valid environment name"
            ));
        }
        if let (Some(min), Some(max)) = (rule.min, rule.max)
            && min > max
        {
            return Err(format!("contract key {key:?} has min greater than max"));
        }
        if (rule.min.is_some() || rule.max.is_some())
            && !matches!(rule.kind, ValueType::Integer | ValueType::Number)
        {
            return Err(format!(
                "contract key {key:?} uses numeric bounds on a non-number type"
            ));
        }
        if rule.allowed.as_ref().is_some_and(Vec::is_empty) {
            return Err(format!("contract key {key:?} has an empty allowed list"));
        }
    }
    Ok(())
}

fn parse_env(source: &str, profile: Profile, source_name: &'static str) -> ParsedEnv {
    let mut values: BTreeMap<String, ParsedValue> = BTreeMap::new();
    let mut diagnostics = Vec::new();
    for (index, original) in source.lines().enumerate() {
        let line_number = index + 1;
        let line = original.trim_end_matches('\r');
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }

        let content = if profile == Profile::Python
            && trimmed
                .strip_prefix("export")
                .is_some_and(|rest| rest.starts_with(char::is_whitespace))
        {
            trimmed["export".len()..].trim_start()
        } else {
            line
        };

        let Some((raw_key, raw_value)) = content.split_once('=') else {
            diagnostics.push(diagnostic(
                Severity::Error,
                "malformed_line",
                None,
                Some(line_number),
                source_name,
                "expected KEY=VALUE; value was not inspected",
            ));
            continue;
        };
        let key = raw_key.trim();
        if !valid_key(key) {
            diagnostics.push(diagnostic(
                Severity::Error,
                "invalid_key",
                None,
                Some(line_number),
                source_name,
                "environment key must match [A-Za-z_][A-Za-z0-9_]*",
            ));
            continue;
        }
        let value = match profile {
            Profile::Docker => {
                let value = raw_value.to_owned();
                if surrounded_by_quote(value.trim()) {
                    diagnostics.push(diagnostic(
                        Severity::Warning,
                        "literal_quotes",
                        Some(key.to_owned()),
                        Some(line_number),
                        source_name,
                        "Docker keeps surrounding quotes as part of this value",
                    ));
                }
                value
            }
            Profile::Node | Profile::Python => parse_dotenv_value(
                raw_value,
                key,
                line_number,
                profile,
                source_name,
                &mut diagnostics,
            ),
        };

        if profile == Profile::Python && value.contains("${") {
            diagnostics.push(diagnostic(
                Severity::Warning,
                "interpolation_not_resolved",
                Some(key.to_owned()),
                Some(line_number),
                source_name,
                "Python may interpolate this value at runtime; validation leaves it unresolved",
            ));
        }

        if let Some(first) = values.get(key) {
            diagnostics.push(diagnostic(
                Severity::Warning,
                "duplicate_key",
                Some(key.to_owned()),
                Some(line_number),
                source_name,
                format!(
                    "duplicate key replaces the declaration on line {}",
                    first.line
                ),
            ));
        }
        values.insert(
            key.to_owned(),
            ParsedValue {
                value,
                line: line_number,
            },
        );
    }
    ParsedEnv {
        values,
        diagnostics,
    }
}

fn parse_dotenv_value(
    raw: &str,
    key: &str,
    line: usize,
    profile: Profile,
    source_name: &'static str,
    diagnostics: &mut Vec<Diagnostic>,
) -> String {
    let trimmed = raw.trim();
    let Some(quote) = trimmed
        .chars()
        .next()
        .filter(|ch| *ch == '\'' || *ch == '"')
    else {
        return trimmed
            .split('#')
            .next()
            .unwrap_or_default()
            .trim_end()
            .to_owned();
    };

    let mut escaped = false;
    let mut closing = None;
    for (offset, ch) in trimmed.char_indices().skip(1) {
        if quote == '"' && ch == '\\' && !escaped {
            escaped = true;
            continue;
        }
        if ch == quote && !escaped {
            closing = Some(offset);
            break;
        }
        escaped = false;
    }
    let Some(close) = closing else {
        diagnostics.push(diagnostic(
            Severity::Error,
            "unclosed_quote",
            Some(key.to_owned()),
            Some(line),
            source_name,
            "quoted value has no closing quote",
        ));
        return String::new();
    };
    let tail = trimmed[close + quote.len_utf8()..].trim();
    if !tail.is_empty() && !tail.starts_with('#') {
        diagnostics.push(diagnostic(
            Severity::Error,
            "trailing_content",
            Some(key.to_owned()),
            Some(line),
            source_name,
            "unexpected content follows the closing quote",
        ));
    }
    let inner = &trimmed[quote.len_utf8()..close];
    if quote == '"' {
        decode_double_quoted(inner, key, line, profile, source_name, diagnostics)
    } else {
        inner.to_owned()
    }
}

fn decode_double_quoted(
    inner: &str,
    key: &str,
    line: usize,
    profile: Profile,
    source_name: &'static str,
    diagnostics: &mut Vec<Diagnostic>,
) -> String {
    let mut out = String::with_capacity(inner.len());
    let mut chars = inner.chars();
    while let Some(ch) = chars.next() {
        if ch != '\\' {
            out.push(ch);
            continue;
        }
        match chars.next() {
            Some('n') => out.push('\n'),
            Some('r') => out.push('\r'),
            Some('t') => out.push('\t'),
            Some('"') => out.push('"'),
            Some('\\') => out.push('\\'),
            Some(other) => {
                if profile == Profile::Node {
                    diagnostics.push(diagnostic(
                        Severity::Warning,
                        "unknown_escape",
                        Some(key.to_owned()),
                        Some(line),
                        source_name,
                        "double-quoted value contains an unknown escape",
                    ));
                }
                out.push('\\');
                out.push(other);
            }
            None => out.push('\\'),
        }
    }
    out
}

fn validate_values(
    contract: &Contract,
    values: &BTreeMap<String, ParsedValue>,
    options: CheckOptions,
    diagnostics: &mut Vec<Diagnostic>,
) {
    for (key, rule) in &contract.variables {
        let Some(parsed) = values.get(key) else {
            if rule.required {
                diagnostics.push(diagnostic(
                    Severity::Error,
                    "missing_required",
                    Some(key.clone()),
                    None,
                    "current",
                    "required key is absent",
                ));
            }
            continue;
        };
        let value = &parsed.value;
        if value.is_empty() && !rule.allow_empty {
            diagnostics.push(diagnostic(
                if rule.required {
                    Severity::Error
                } else {
                    Severity::Warning
                },
                "unset_value",
                Some(key.clone()),
                Some(parsed.line),
                "current",
                "key is present but empty; set a value or allow_empty in the contract",
            ));
            continue;
        }
        if rule.secret && looks_like_placeholder(value) {
            diagnostics.push(diagnostic(
                Severity::Error,
                "unsafe_placeholder",
                Some(key.clone()),
                Some(parsed.line),
                "current",
                "secret appears to be a placeholder; replace it before deployment",
            ));
        }
        if !rule.secret && looks_sensitive_key(key) {
            diagnostics.push(diagnostic(
                Severity::Warning,
                "unmarked_secret",
                Some(key.clone()),
                Some(parsed.line),
                "current",
                "sensitive-looking key is not marked secret in the contract",
            ));
        }
        validate_type(key, value, parsed.line, rule, diagnostics);
        if let Some(allowed) = &rule.allowed
            && !allowed.iter().any(|candidate| candidate == value)
        {
            diagnostics.push(diagnostic(
                Severity::Error,
                "not_allowed",
                Some(key.clone()),
                Some(parsed.line),
                "current",
                "value is not in the contract's allowed set",
            ));
        }
    }

    for (key, parsed) in values {
        if !contract.variables.contains_key(key) {
            diagnostics.push(diagnostic(
                if options.deny_unused {
                    Severity::Error
                } else {
                    Severity::Warning
                },
                "unused_key",
                Some(key.clone()),
                Some(parsed.line),
                "current",
                "key is not declared in the contract",
            ));
            if looks_sensitive_key(key) {
                diagnostics.push(diagnostic(
                    Severity::Warning,
                    "unmarked_secret",
                    Some(key.clone()),
                    Some(parsed.line),
                    "current",
                    "sensitive-looking key is not declared as a secret in the contract",
                ));
            }
        }
    }
}

fn validate_type(
    key: &str,
    value: &str,
    line: usize,
    rule: &VariableRule,
    diagnostics: &mut Vec<Diagnostic>,
) {
    let parsed_number = match rule.kind {
        ValueType::String => return,
        ValueType::Boolean => {
            if !matches!(value, "true" | "false") {
                type_error(key, line, "expected boolean `true` or `false`", diagnostics);
            }
            return;
        }
        ValueType::Integer => match value.parse::<i64>() {
            Ok(number) => Some(number as f64),
            Err(_) => {
                type_error(key, line, "expected a base-10 integer", diagnostics);
                None
            }
        },
        ValueType::Number => match value.parse::<f64>() {
            Ok(number) if number.is_finite() => Some(number),
            _ => {
                type_error(key, line, "expected a finite number", diagnostics);
                None
            }
        },
        ValueType::Url => {
            let valid = url::Url::parse(value).is_ok_and(|url| {
                matches!(url.scheme(), "http" | "https") && url.host_str().is_some()
            });
            if !valid {
                type_error(
                    key,
                    line,
                    "expected an absolute http or https URL",
                    diagnostics,
                );
            }
            return;
        }
    };
    if let Some(number) = parsed_number {
        if rule.min.is_some_and(|min| number < min) {
            diagnostics.push(diagnostic(
                Severity::Error,
                "below_minimum",
                Some(key.to_owned()),
                Some(line),
                "current",
                "number is below the contract minimum",
            ));
        }
        if rule.max.is_some_and(|max| number > max) {
            diagnostics.push(diagnostic(
                Severity::Error,
                "above_maximum",
                Some(key.to_owned()),
                Some(line),
                "current",
                "number is above the contract maximum",
            ));
        }
    }
}

fn type_error(key: &str, line: usize, message: &str, diagnostics: &mut Vec<Diagnostic>) {
    diagnostics.push(diagnostic(
        Severity::Error,
        "invalid_type",
        Some(key.to_owned()),
        Some(line),
        "current",
        message,
    ));
}

fn compare(
    contract: &Contract,
    current: &BTreeMap<String, ParsedValue>,
    baseline: &BTreeMap<String, ParsedValue>,
) -> Vec<DiffEntry> {
    let keys: BTreeSet<_> = current.keys().chain(baseline.keys()).cloned().collect();
    keys.into_iter()
        .map(|key| {
            let state = match (current.get(&key), baseline.get(&key)) {
                (Some(a), Some(b)) if a.value == b.value => DiffState::Unchanged,
                (Some(_), Some(_)) => DiffState::Changed,
                (Some(_), None) => DiffState::OnlyInCurrent,
                (None, Some(_)) => DiffState::OnlyInBaseline,
                (None, None) => unreachable!(),
            };
            let secret = contract.variables.get(&key).is_some_and(|rule| rule.secret)
                || looks_sensitive_key(&key);
            DiffEntry { key, state, secret }
        })
        .collect()
}

fn valid_key(key: &str) -> bool {
    let mut chars = key.chars();
    chars
        .next()
        .is_some_and(|ch| ch == '_' || ch.is_ascii_alphabetic())
        && chars.all(|ch| ch == '_' || ch.is_ascii_alphanumeric())
}

fn surrounded_by_quote(value: &str) -> bool {
    (value.starts_with('"') && value.ends_with('"'))
        || (value.starts_with('\'') && value.ends_with('\''))
}

fn looks_sensitive_key(key: &str) -> bool {
    let upper = key.to_ascii_uppercase();
    [
        "SECRET",
        "PASSWORD",
        "PASSWD",
        "TOKEN",
        "PRIVATE_KEY",
        "API_KEY",
    ]
    .iter()
    .any(|word| upper.contains(word))
}

fn looks_like_placeholder(value: &str) -> bool {
    let normalized = value.trim().to_ascii_lowercase();
    matches!(
        normalized.as_str(),
        "changeme"
            | "change_me"
            | "placeholder"
            | "example"
            | "your_secret_here"
            | "secret"
            | "password"
            | "xxx"
            | "todo"
            | "replace_me"
    ) || (normalized.starts_with('<') && normalized.ends_with('>'))
}

fn diagnostic(
    severity: Severity,
    code: &'static str,
    key: Option<String>,
    line: Option<usize>,
    source: &'static str,
    message: impl Into<String>,
) -> Diagnostic {
    Diagnostic {
        severity,
        code,
        key,
        line,
        source,
        message: message.into(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn contract() -> Contract {
        parse_contract(
            r#"
version = 1
[variables.PORT]
type = "integer"
required = true
min = 1
max = 65535
[variables.DEBUG]
type = "boolean"
required = true
[variables.API_TOKEN]
secret = true
required = true
[variables.ORIGIN]
type = "url"
[variables.MODE]
allowed = ["dev", "prod"]
"#,
        )
        .unwrap()
    }

    fn codes(report: &Report) -> Vec<&str> {
        report.diagnostics.iter().map(|item| item.code).collect()
    }

    #[test]
    fn clean_node_file_passes() {
        let report = check(
            &contract(),
            "PORT=3000\nDEBUG=false\nAPI_TOKEN=s3cure\nORIGIN=https://example.test\nMODE=prod",
            None,
            Profile::Node,
            CheckOptions::default(),
        );
        assert!(report.ok, "{:?}", report.diagnostics);
    }

    #[test]
    fn parser_profiles_disagree_about_quotes() {
        let input = "PORT=\"3000\"\nDEBUG=\"false\"\nAPI_TOKEN=\"s3cure\"";
        let node = check(
            &contract(),
            input,
            None,
            Profile::Node,
            CheckOptions::default(),
        );
        let docker = check(
            &contract(),
            input,
            None,
            Profile::Docker,
            CheckOptions::default(),
        );
        assert!(!codes(&node).contains(&"invalid_type"));
        assert!(codes(&docker).contains(&"invalid_type"));
        assert!(codes(&docker).contains(&"literal_quotes"));
    }

    #[test]
    fn secret_values_never_serialize() {
        let secret = "astonishingly-unique-value";
        let report = check(
            &contract(),
            &format!("PORT=3000\nDEBUG=true\nAPI_TOKEN={secret}"),
            Some("PORT=3001\nDEBUG=true\nAPI_TOKEN=other"),
            Profile::Node,
            CheckOptions::default(),
        );
        let json = serde_json::to_string(&report).unwrap();
        assert!(!json.contains(secret));
        assert_eq!(report.comparison[2].state, DiffState::Changed);
    }

    #[test]
    fn seeded_faults_are_detected() {
        let cases = [
            ("PORT=nope\nDEBUG=true\nAPI_TOKEN=x", "invalid_type"),
            ("PORT=0\nDEBUG=true\nAPI_TOKEN=x", "below_minimum"),
            ("PORT=70000\nDEBUG=true\nAPI_TOKEN=x", "above_maximum"),
            ("DEBUG=true\nAPI_TOKEN=x", "missing_required"),
            ("PORT=2\nAPI_TOKEN=x", "missing_required"),
            ("PORT=2\nDEBUG=true", "missing_required"),
            ("PORT=2\nDEBUG=yes\nAPI_TOKEN=x", "invalid_type"),
            (
                "PORT=2\nDEBUG=true\nAPI_TOKEN=changeme",
                "unsafe_placeholder",
            ),
            ("PORT=2\nDEBUG=true\nAPI_TOKEN=", "unset_value"),
            ("PORT=2\nDEBUG=true\nAPI_TOKEN=x\nEXTRA=1", "unused_key"),
            (
                "PORT=2\nDEBUG=true\nAPI_TOKEN=x\nBAD LINE",
                "malformed_line",
            ),
            ("PORT=2\nDEBUG=true\nAPI_TOKEN=x\n1BAD=y", "invalid_key"),
            ("PORT=2\nPORT=3\nDEBUG=true\nAPI_TOKEN=x", "duplicate_key"),
            (
                "PORT=2\nDEBUG=true\nAPI_TOKEN=x\nORIGIN=relative",
                "invalid_type",
            ),
            ("PORT=2\nDEBUG=true\nAPI_TOKEN=x\nMODE=test", "not_allowed"),
            ("PORT='2\nDEBUG=true\nAPI_TOKEN=x", "unclosed_quote"),
            ("PORT='2'x\nDEBUG=true\nAPI_TOKEN=x", "trailing_content"),
            (
                "PORT=2\nDEBUG=true\nAPI_TOKEN=x\nPASSWORD=nope",
                "unmarked_secret",
            ),
            (
                "PORT=2\nDEBUG=true\nAPI_TOKEN=x\nORIGIN=ftp://example.test",
                "invalid_type",
            ),
            ("PORT=2.5\nDEBUG=true\nAPI_TOKEN=x", "invalid_type"),
        ];
        for (input, expected) in cases {
            let report = check(
                &contract(),
                input,
                None,
                Profile::Node,
                CheckOptions::default(),
            );
            assert!(
                codes(&report).contains(&expected),
                "missed {expected} for seeded case"
            );
        }
    }

    #[test]
    fn python_export_and_interpolation_are_profile_specific() {
        let input = "export PORT=3\nDEBUG=false\nAPI_TOKEN=${TOKEN}";
        let python = check(
            &contract(),
            input,
            None,
            Profile::Python,
            CheckOptions::default(),
        );
        let node = check(
            &contract(),
            input,
            None,
            Profile::Node,
            CheckOptions::default(),
        );
        assert!(codes(&python).contains(&"interpolation_not_resolved"));
        assert!(codes(&node).contains(&"invalid_key"));
    }

    #[test]
    fn invalid_contracts_are_rejected() {
        assert!(parse_contract("version=2\n[variables.X]").is_err());
        assert!(parse_contract("version=1\n[variables.X]\ntype='string'\nmin=1").is_err());
        assert!(parse_contract("version=1\n[variables.'BAD KEY']").is_err());
    }
}
