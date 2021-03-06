const { parseActionLabels } = require("./labelParser");
const { arrayIntersection } = require("./arrayHelper");
const core = require("@actions/core");
const { isPullRequest, getPullRequestLabels } = require("./github");

const run = async () => {
  try {
    if (!isPullRequest()) {
      core.setFailed(
        "Invalid event specified, it should be used on [pull_request, pull_request_target] events"
      );
      return;
    }

    const labelsToSearch = parseActionLabels(core.getInput("labels"));
    if (labelsToSearch.length === 0) {
      core.setFailed(
        "No labels requested to search, please provide a comma-seperated list of labels"
      );
      return;
    }
    core.info(`Requested labels: ${labelsToSearch}`);

    const pullRequestLabels = getPullRequestLabels();
    if (pullRequestLabels.length === 0) {
      core.setFailed("No labels currently present on Pull Request");
      return;
    }
    core.info(`Pull Request labels: ${pullRequestLabels}`);

    const filtered = arrayIntersection(pullRequestLabels, labelsToSearch);
    if (filtered.length === 0) {
      core.setFailed("Label intersection yielded no matches");
      return;
    }

    switch (core.getInput("mode")) {
      case "all": {
        if (filtered.length !== labelsToSearch.length) {
          core.setFailed("Pull Request does not contain all required labels");
          return;
        }
        break;
      }
      case "singular": {
        if (filtered.length !== 1) {
          core.setFailed(
            "Found multiple labels where a single label is required"
          );
          return;
        }
        break;
      }
    }

    core.setOutput("matchedLabels", filtered.join());
    core.info(`Matched labels: ${filtered}`);
  } catch (error) {
    core.setFailed(error.message);
  }
};

module.exports = run;
