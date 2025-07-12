jwplayer.key = "ITWMv7t88JGzI0xPwW8I0+LveiXX9SWbfdmt0ArUSyc=";

jwplayer("player").setup({
  file: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", // sample HLS
  width: "100%",
  aspectratio: "16:9",
  autostart: true
});
