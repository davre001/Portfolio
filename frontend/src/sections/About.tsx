import Reveal from '../components/Reveal';

export default function About() {
  return (
    <section className="section about" id="about">
      <Reveal className="about__inner">
        <div className="about__bio">
          <p className="about__body">
            The studio handles direction, editorial, and motion design, but the real
            focus these days is where AI meets cinema. We&rsquo;re figuring out, in real
            time, what&rsquo;s possible when traditional filmmaking craft gets paired
            with tools that didn&rsquo;t exist a few years ago, and using that to
            make work that actually stands out instead of looking like everything else
            on your timeline.
          </p>
          <p className="about__body">
            Our work spans editorial reels, brand motion systems, and AI-assisted
            production, always aimed at making people feel something.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
