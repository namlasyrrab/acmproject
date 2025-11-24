import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function DiscordLinked() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const discordId = searchParams.get('discordId');
    const discordTag = searchParams.get('discordTag');

    console.log('[DiscordLinked] Mounted');
    console.log('[DiscordLinked] URL params:', { discordId, discordTag });

    // If no discordId in URL, just go back
    if (!discordId) {
      console.warn('[DiscordLinked] No discordId in URL, sending back to /settings');
      // 🔹 CHANGED: use replace so this entry isn't kept in history
      navigate('/settings', { replace: true });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[DiscordLinked] onAuthStateChanged fired. user =', user);

      if (!user) {
        console.warn('[DiscordLinked] No logged in user. Redirecting to /login');
        // You *can* keep this as-is, but using replace is usually nicer:
        navigate('/login', { replace: true });
        return;
      }

      try {
        console.log('[DiscordLinked] Writing to Firestore for uid:', user.uid);
        await setDoc(
          doc(db, 'users', user.uid),
          {
            discordUserId: discordId,
            discordTag: discordTag || null,
            discordNotificationsEnabled: true,
          },
          { merge: true }
        );
        console.log('[DiscordLinked] Successfully saved Discord info to Firestore');
      } catch (error) {
        console.error('[DiscordLinked] Error saving Discord info:', error);
      }

      // 🔹 CHANGED: replace history so this callback page is not in back stack
      navigate('/settings', { replace: true });
    });

    return () => {
      console.log('[DiscordLinked] Cleanup unsubscribe');
      unsubscribe();
    };
  }, [searchParams, navigate]);

  return (
    <div style={{ padding: '30px' }}>
      <h2>Linking your Discord account...</h2>
      <p>Please wait, redirecting you back to Settings.</p>
    </div>
  );
}