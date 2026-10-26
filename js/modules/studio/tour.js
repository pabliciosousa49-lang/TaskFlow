
document.addEventListener("DOMContentLoaded", () => {
  // Tour — Seleção - localizar controles e vídeo
  const abrir = document.getElementById("abrir-tour");
  const fechar = document.getElementById("fechar-tour");
  const modal = document.getElementById("modal-tour");
  const video = document.getElementById("video-tour");

  if (!abrir || !fechar || !modal || !video) return;

  // Tour — Escuta - abrir apresentação
  abrir.addEventListener("click", () => {
    modal.showModal();
    video.play().catch(() => {
      // O usuário poderá iniciar pelo controle do vídeo.
    });
  });

  // Tour — Escuta - fechar apresentação
  fechar.addEventListener("click", () => {
    modal.close();
  });

  // Tour — Atualização - interromper reprodução ao fechar
  modal.addEventListener("close", () => {
    video.pause();
    video.currentTime = 0;
  });

  // Tour — Escuta - fechar ao clicar fora do conteúdo
  modal.addEventListener("click", (evento) => {
    if (evento.target === modal) {
      modal.close();
    }
  });
});
