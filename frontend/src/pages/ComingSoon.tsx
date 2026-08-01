import { useEffect } from 'react';

/** Standalone maintenance screen for routes that are not ready yet. */
export default function ComingSoon() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="maintenance">
      <p className="maintenance__msg">App Under Maintenance, Check Back Later</p>
    </section>
  );
}
