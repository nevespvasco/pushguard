export function isTTY(): boolean {
  return process.stdout.isTTY === true;
}

export function isCI(): boolean {
  return !!(
    process.env.CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.JENKINS_URL ||
    process.env.BUILDKITE ||
    process.env.TEAMCITY_VERSION
  );
}

export function shouldAllowInteractive(): boolean {
  return isTTY() && !isCI();
}

export function forceSilentMode(): boolean {
  return !isTTY() || isCI();
}
