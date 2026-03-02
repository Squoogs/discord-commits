const { MessageEmbed, WebhookClient } = require("discord.js");
const fs = require("fs");
const path = require("path");
const MAX_MESSAGE_LENGTH = 72;

module.exports.send = (id, token, repo, url, commits, size, pusher) =>
  new Promise((resolve, reject) => {
    let client;
    const username = repo.replace(/(discord)/gi, "******");
    const discordUsername = getDiscordUsername(pusher);
    console.log("Preparing Webhook...");
    try {
      client = new WebhookClient({
        id: id,
        token: token,
      });
      client
        .send({
          username: username,
          embeds: [createEmbed(url, commits, size, pusher, discordUsername)],
        })
        .then(() => {
          console.log("Successfully sent the message!");
          resolve();
        }, reject);
    } catch (error) {
      console.log("Error creating Webhook");
      reject(error.message);
      return;
    }
  });

function getDiscordUsername(githubUsername) {
  try {
    const map = JSON.parse(
      fs.readFileSync(
        path.join(process.env.GITHUB_WORKSPACE, ".github/discord-users.json"),
        "utf8",
      ),
    );
    return map[githubUsername] || githubUsername;
  } catch {
    return githubUsername;
  }
}

function createEmbed(url, commits, size, pusher, discordUsername) {
  console.log("Constructing Embed...");
  console.log("Commits :");
  console.log(commits);
  if (!commits) {
    console.log("No commits, skipping...");
    return;
  }
  const latest = commits[0];
  return new MessageEmbed()
    .setColor(0xf1e542)
    .setAuthor({
      name: `⚡ ${discordUsername} pushed ${size} commit${
        size === 1 ? "" : "s"
      }`,
      iconURL: `https://github.com/${pusher}.png?size=64`,
      url: url,
    })
    .setDescription(`${getChangeLog(commits, size)}`)
    .setTimestamp(Date.parse(latest.timestamp));
}

function getChangeLog(commits, size) {
  let changelog = "";
  for (const i in commits) {
    if (i > 7) {
      changelog += `+ ${size - i} more...\n`;
      break;
    }

    const commit = commits[i];
    const sha = commit.id.substring(0, 6);
    const message =
      commit.message.length > MAX_MESSAGE_LENGTH
        ? commit.message.substring(0, MAX_MESSAGE_LENGTH) + "..."
        : commit.message;
    changelog += `[\`${sha}\`](${commit.url}) — ${message}\n`;
  }

  return changelog;
}
