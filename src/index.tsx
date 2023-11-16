import {Plugin, registerPlugin} from 'enmity/managers/plugins'
import {React} from 'enmity/metro/common'
import {create} from 'enmity/patcher'
// @ts-ignore
import manifest, {name as plugin_name} from '../manifest.json'
import Settings from "./components/Settings"
import {getByProps} from "enmity/modules"
import {get, set} from "enmity/api/settings"

// Make sure to disable "sync across clients"

const Themer = getByProps("updateBackgroundGradientPreset")
const PermStat = getByProps("canUseClientThemes", {defaultExport: false});
const {ExperimentStore} = getByProps('useAndTrackExposureToUserExperiment')
const UserSettings = getByProps("setShouldSyncAppearanceSettings")

const Patcher = create('FreeNitroTheme')

const FreeNitroTheme: Plugin = {
    ...manifest,
    onStart() {
        // disable theme sync
        UserSettings.setShouldSyncAppearanceSettings(false)
        Patcher.before(UserSettings, "setShouldSyncAppearanceSettings", (self, args, res) => {
            args[0] = false
        })

        // apply theme on startup before Discord applies it. we can't wait  Discord to load it
        if (get(plugin_name, "theme", -1) > 0) {
            Themer.updateBackgroundGradientPreset(get(plugin_name, "theme", -1))
        }

        // enable client theme experiment
        Patcher.after(ExperimentStore, 'getUserExperimentDescriptor', (self, [expName], res) => {
            if (expName === "2023-02_client_themes_mobile" && res?.bucket) {
                return {
                    type: 'user',
                    revision: 1,
                    population: 0,
                    bucket: 1,
                    override: true
                }
            }
        })


        if (Object.isFrozen(PermStat.default)) {
            PermStat.default = {...PermStat.default}
        }
        // make client theme available
        Patcher.instead(PermStat.default, "canUseClientThemes", (_, args, __) => {
            return true
        })


        // detect theme selection
        Patcher.after(Themer, "updateMobilePendingThemeIndex", (_, args, __) => {
            // it uses mobileThemesIndex, which is different from presetId
            if (0 <= args[0] && args[0] <= 2) { // non nitro client theme
                set(plugin_name, "theme", -1)  // at this time, update background gradient preset won't be called. so I need to reset the value I store manually
            }
            // console.log(`change: ${args[0]}`)
        })

        // detect theme application
        Patcher.after(Themer, "updateBackgroundGradientPreset", (_, args, __) => {
            // on change or on apply at startup (uses presetId)
            // 8~19: dark / 0~7: light
            set(plugin_name, "theme", args[0])
            // console.log(`apply: ${args[0]}`)
        })
    },
    onStop() {
        Patcher.unpatchAll()
    },
    getSettingsPanel({settings}) {
        return <Settings settings={settings}/>
    }
}

registerPlugin(FreeNitroTheme)
