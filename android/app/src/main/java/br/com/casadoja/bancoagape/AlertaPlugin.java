package br.com.casadoja.bancoagape;

import android.app.NotificationManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Ponte JS ↔ Android para o chamado de oração. */
@CapacitorPlugin(name = "AlertaOracao")
public class AlertaPlugin extends Plugin {
    @PluginMethod
    public void tocar(PluginCall call) {
        AlertaSomService.iniciar(getContext(), call.getString("titulo"), call.getString("corpo"));
        call.resolve();
    }

    @PluginMethod
    public void parar(PluginCall call) {
        AlertaSomService.parar(getContext());
        call.resolve();
    }

    /** Diz se o app pode abrir em tela cheia por cima de tudo (Android 14+ pede autorização). */
    @PluginMethod
    public void status(PluginCall call) {
        JSObject r = new JSObject();
        boolean tela = true;
        if (Build.VERSION.SDK_INT >= 34) {
            NotificationManager nm = (NotificationManager) getContext().getSystemService(android.content.Context.NOTIFICATION_SERVICE);
            tela = nm.canUseFullScreenIntent();
        }
        r.put("telaCheia", tela);
        r.put("tocando", AlertaSomService.tocando);
        call.resolve(r);
    }

    @PluginMethod
    public void abrirAjusteTelaCheia(PluginCall call) {
        try {
            Intent i = Build.VERSION.SDK_INT >= 34
                ? new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:" + getContext().getPackageName()))
                : new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Exception e) {}
        call.resolve();
    }
}
