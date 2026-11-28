package br.com.casadoja.bancoagape;

import androidx.annotation.NonNull;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

/** Recebe o push. Se for chamado de oração, dispara o alarme na hora (mesmo com o app fechado). */
public class AlertaMessagingService extends MessagingService {
    @Override
    public void onMessageReceived(@NonNull RemoteMessage msg) {
        Map<String, String> d = msg.getData();
        if ("alerta_oracao".equals(d.get("tipo"))) {
            AlertaSomService.iniciar(this, d.get("titulo"), d.get("corpo"));
        }
        super.onMessageReceived(msg);
    }
}
