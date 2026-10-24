import { scanPlugins, DEFAULT_PLUGIN_DIRECTORY, recoverPluginTransaction, withPluginLock } from "./plugin-files.ts";

const index = await withPluginLock(DEFAULT_PLUGIN_DIRECTORY, async () => {
  await recoverPluginTransaction(DEFAULT_PLUGIN_DIRECTORY);
  return scanPlugins();
});
console.info(`Plugin directory: ${DEFAULT_PLUGIN_DIRECTORY}`);
console.info(`Indexed ${index.plugins.length} plugin(s).`);
for (const { id, error } of index.errors) console.error(`${id}: ${error}`);
if (index.errors.length) process.exitCode = 1;
