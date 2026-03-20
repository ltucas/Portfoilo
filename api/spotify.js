export default async function handler(req, res) {
  const {
    SPOTIFY_CLIENT_ID: client_id,
    SPOTIFY_CLIENT_SECRET: client_secret,
    SPOTIFY_REFRESH_TOKEN: refresh_token,
  } = process.env;

  // Fallback if env variables are not deployed yet
  if (!client_id || !client_secret || !refresh_token) {
    return res.status(200).json({
      isPlaying: true,
      title: "Lady",
      artist: "Avenoir",
      songUrl: "https://open.spotify.com/track/1aeRSlCn1EF7f5q7b5l6uu"
    });
  }

  try {
    const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token,
      }),
    });

    const { access_token } = await tokenResponse.json();

    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (response.status === 204 || response.status > 400) {
      return res.status(200).json({ isPlaying: false });
    }

    const song = await response.json();
    if (!song.item) {
       return res.status(200).json({ isPlaying: false });
    }

    return res.status(200).json({
      isPlaying: song.is_playing,
      title: song.item.name,
      artist: song.item.artists.map((_artist) => _artist.name).join(", "),
      songUrl: song.item.external_urls.spotify,
    });
  } catch (error) {
    console.error("Spotify API error:", error);
    return res.status(200).json({
      isPlaying: true,
      title: "Lady",
      artist: "Avenoir",
      songUrl: "https://open.spotify.com/track/1aeRSlCn1EF7f5q7b5l6uu"
    });
  }
}
