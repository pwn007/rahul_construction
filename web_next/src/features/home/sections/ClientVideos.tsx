'use client';

import { useCallback, useMemo, useState } from 'react';
import { resolveVideo } from '@/components/common/VideoLightbox';
import { useClientVideos } from '@/hooks/useClientVideos';
import { ClientStoryPlayer } from './ClientStoryPlayer';
import { DeckFace, StoryDeck } from './StoryDeck';

/**
 * Client stories — recorded client testimonials.
 *
 * The deck (StoryDeck: a row of cards from `md`, one screen-filling card on a
 * phone) built to the client's prototype, Oct 2026. Its film data is its own
 * resource (`client-videos`, Admin → Client videos), so there can be more films
 * than written quotes, or fewer.
 *
 * "Desktop responsive layout" over the title, "Click any card for Cinema
 * Popup", the phone's "90% center video stage" and the player's "100%
 * full-screen reel" were the prototype's words, kept at the client's request
 * (Oct 2026). They came off on 25 Oct 2026 when the band went neutral, read as
 * a designer's annotations; the eyebrow is "On camera" now. Restore from git
 * if the client wants them back.
 *
 * Any card opens `ClientStoryPlayer`, the full-screen player, on that film.
 * The films are files (the client confirmed none will be YouTube), so the
 * player draws its own controls; a provider link still plays, in that
 * provider's player.
 */
export function ClientVideos() {
  const raw = useClientVideos();

  /* A row with no playable URL would be a play button that does nothing. */
  const videos = useMemo(
    () => raw.filter((v) => v.videoUrl && resolveVideo(v.videoUrl)).sort((a, b) => a.order - b.order),
    [raw],
  );

  /* The player: which film it is showing, or closed. */
  const [playing, setPlaying] = useState<number | null>(null);
  const close = useCallback(() => setPlaying(null), []);

  if (!videos.length) return null;

  return (
    <>
      <StoryDeck
        items={videos}
        dataSection="client-videos"
        label={{ row: 'Client videos', items: 'Videos', item: 'Video' }}
        /* "Desktop responsive layout" until 25 Oct 2026 — the prototype's
           note on its own layout, which had come through as the eyebrow. */
        overline="On camera"
        title={
          <>
            <span className="text-[rgb(var(--c-brand-text))]">Client</span> stories
          </>
        }
        face={(v, i, stage, on) => (
          <DeckFace image={v.poster} n={i + 1} total={videos.length} stage={stage} on={on} icon="play" stageLabel="Video" name={v.name} />
        )}
        nameOf={(v) => v.name}
        cardLabel={(v) => `Play video from ${v.name}, ${v.locality}`}
        onOpen={setPlaying}
      />
      <ClientStoryPlayer videos={videos} index={playing} onIndex={setPlaying} onClose={close} />
    </>
  );
}
