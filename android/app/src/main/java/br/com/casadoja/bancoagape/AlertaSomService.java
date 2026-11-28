package br.com.casadoja.bancoagape;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;

/**
 * Alarme do chamado de oração: abre a tela do app por cima de tudo (até com a tela bloqueada),
 * toca a sirene no volume MÁXIMO pelo canal de alarme (toca mesmo no silencioso) e vibra,
 * até a pessoa tocar em "Estou indo".
 */
public class AlertaSomService extends Service {
    static final String CANAL = "alerta-oracao-tela";
    static final int ID = 7272;
    static final String PARAR = "br.com.casadoja.bancoagape.PARAR_ALERTA";
    static boolean tocando = false;

    private MediaPlayer player;
    private Vibrator vibrador;
    private int volumeAntes = -1;
    private PowerManager.WakeLock wake;
    private final Handler h = new Handler(Looper.getMainLooper());

    public static void iniciar(Context c, String titulo, String corpo) {
        Intent i = new Intent(c, AlertaSomService.class);
        i.putExtra("titulo", titulo); i.putExtra("corpo", corpo);
        try {
            if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i); else c.startService(i);
        } catch (Exception e) {
            // se o sistema não deixar iniciar o serviço, pelo menos mostra a notificação de tela cheia
            try { mostrarNotificacao(c, titulo, corpo, false); } catch (Exception ignored) {}
        }
    }

    public static void parar(Context c) {
        Intent i = new Intent(c, AlertaSomService.class); i.setAction(PARAR);
        try { c.startService(i); } catch (Exception e) { c.stopService(new Intent(c, AlertaSomService.class)); }
        ((NotificationManager) c.getSystemService(NOTIFICATION_SERVICE)).cancel(ID);
    }

    static void criarCanal(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(NOTIFICATION_SERVICE);
        if (nm.getNotificationChannel(CANAL) != null) return;
        NotificationChannel ch = new NotificationChannel(CANAL, "Chamado de oração (tela cheia)", NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("Abre o alerta de oração na tela na hora");
        ch.setSound(null, null); // o som é tocado pelo próprio app, no volume máximo
        ch.enableVibration(false);
        ch.setBypassDnd(true);
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(ch);
    }

    static Notification construir(Context c, String titulo, String corpo) {
        criarCanal(c);
        Intent abrir = new Intent(c, MainActivity.class);
        abrir.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        abrir.putExtra("alerta_oracao", true);
        int fl = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent pAbrir = PendingIntent.getActivity(c, 1, abrir, fl);
        Intent parar = new Intent(c, AlertaSomService.class); parar.setAction(PARAR);
        PendingIntent pParar = PendingIntent.getService(c, 2, parar, fl);
        return new NotificationCompat.Builder(c, CANAL)
            .setSmallIcon(R.drawable.ic_stat_agape)
            .setColor(0xFFD21F1A)
            .setContentTitle(titulo != null ? titulo : "ALERTA: MOMENTO DE ORAÇÃO")
            .setContentText(corpo != null ? corpo : "Dirija-se agora ao local de oração.")
            .setStyle(new NotificationCompat.BigTextStyle().bigText(corpo))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setFullScreenIntent(pAbrir, true)
            .setContentIntent(pAbrir)
            .addAction(0, "🙏 ESTOU INDO", pParar)
            .setOngoing(true)
            .setAutoCancel(false)
            .build();
    }

    static void mostrarNotificacao(Context c, String titulo, String corpo, boolean ignorar) {
        ((NotificationManager) c.getSystemService(NOTIFICATION_SERVICE)).notify(ID, construir(c, titulo, corpo));
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && PARAR.equals(intent.getAction())) { encerrar(); return START_NOT_STICKY; }
        String titulo = intent != null ? intent.getStringExtra("titulo") : null;
        String corpo = intent != null ? intent.getStringExtra("corpo") : null;
        Notification n = construir(this, titulo, corpo);
        if (Build.VERSION.SDK_INT >= 29) startForeground(ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        else startForeground(ID, n);
        if (!tocando) tocar();
        // abre a tela do alerta na hora (se o sistema permitir; senão a notificação de tela cheia faz isso)
        try {
            Intent abrir = new Intent(this, MainActivity.class);
            abrir.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            abrir.putExtra("alerta_oracao", true);
            startActivity(abrir);
        } catch (Exception ignored) {}
        h.removeCallbacksAndMessages(null);
        h.postDelayed(this::encerrar, 5 * 60 * 1000); // segurança: para sozinho depois de 5 minutos
        return START_NOT_STICKY;
    }

    private void tocar() {
        tocando = true;
        try {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            wake = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "bancoagape:alerta");
            wake.acquire(5 * 60 * 1000L);
        } catch (Exception ignored) {}
        AudioManager am = (AudioManager) getSystemService(AUDIO_SERVICE);
        try {
            volumeAntes = am.getStreamVolume(AudioManager.STREAM_ALARM);
            am.setStreamVolume(AudioManager.STREAM_ALARM, am.getStreamMaxVolume(AudioManager.STREAM_ALARM), 0);
        } catch (Exception ignored) {}
        try {
            player = new MediaPlayer();
            player.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
            player.setDataSource(this, Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.alerta));
            player.setLooping(true);
            player.setVolume(1f, 1f);
            player.prepare();
            player.start();
        } catch (Exception ignored) {}
        try {
            vibrador = (Vibrator) getSystemService(VIBRATOR_SERVICE);
            long[] padrao = {0, 900, 250, 900, 250, 900, 600};
            if (Build.VERSION.SDK_INT >= 26) vibrador.vibrate(VibrationEffect.createWaveform(padrao, 0));
            else vibrador.vibrate(padrao, 0);
        } catch (Exception ignored) {}
    }

    private void encerrar() {
        h.removeCallbacksAndMessages(null);
        tocando = false;
        try { if (player != null) { player.stop(); player.release(); } } catch (Exception ignored) {}
        player = null;
        try { if (vibrador != null) vibrador.cancel(); } catch (Exception ignored) {}
        try {
            if (volumeAntes >= 0) ((AudioManager) getSystemService(AUDIO_SERVICE)).setStreamVolume(AudioManager.STREAM_ALARM, volumeAntes, 0);
        } catch (Exception ignored) {}
        volumeAntes = -1;
        try { if (wake != null && wake.isHeld()) wake.release(); } catch (Exception ignored) {}
        if (Build.VERSION.SDK_INT >= 24) stopForeground(STOP_FOREGROUND_REMOVE); else stopForeground(true);
        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).cancel(ID);
        stopSelf();
    }

    @Override public void onDestroy() { if (tocando) encerrar(); super.onDestroy(); }
    @Override public IBinder onBind(Intent i) { return null; }
}
