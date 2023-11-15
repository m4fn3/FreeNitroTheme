import {Plugin, registerPlugin} from 'enmity/managers/plugins'
import {React} from 'enmity/metro/common'
import {create} from 'enmity/patcher'
// @ts-ignore
import manifest, {name as plugin_name} from '../manifest.json'
import {getByProps} from "enmity/modules"
import {get, set} from "enmity/api/settings"

// Make sure to disable "sync across clients"

const canuse = getByProps("canUseClientThemes")
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
        Patcher.instead("client-themes", getByProps("canUseClientThemes"), () => true)
    },
    onStop() {
        Patcher.unpatchAll()
    }
}

registerPlugin(FreeNitroTheme)
