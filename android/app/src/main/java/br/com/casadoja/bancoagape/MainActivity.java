package br.com.casadoja.bancoagape;

import android.app.KeyguardManager;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AlertaPlugin.class);
        super.onCreate(savedInstanceState);
        porCimaDaTela(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        porCimaDaTela(intent);
    }

    /** Chamado de oração: liga a tela e abre o app por cima da tela de bloqueio. */
    private void porCimaDaTela(Intent i) {
        if (i == null || !i.getBooleanExtra("alerta_oracao", false)) return;
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(KEYGUARD_SERVICE);
            if (km != null) km.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        // avisa a página para mostrar o alerta vermelho
        if (getBridge() != null) getBridge().triggerWindowJSEvent("alertaOracaoNativo");
    }
}
