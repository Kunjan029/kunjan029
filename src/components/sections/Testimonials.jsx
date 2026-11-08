import Container from '../ui/Container.jsx'
import Reveal from '../ui/Reveal.jsx'
import './Testimonials.css'

// From the previous portfolio: people Kunjan has worked with
const ITEMS = [
  { head: 'Design speed that never sacrifices attention to detail.', text: 'Kunjan consistently delivered high-quality designs faster than expected. His speed never compromised quality, in fact, it raised the bar for our entire team. You can count on him when timelines are tight and impact truly matters.', name: 'Priyanka Challa', role: 'Sr. GTM Specialist' },
  { head: 'Grasps concepts quickly and translates them into neat visuals.', text: 'Kunjan picks up ideas and instructions quickly, which made working with him efficient. He understands the design direction early on and doesn’t need repeated follow-ups. His quick grasp helped our project move faster and smoother.', name: 'Sonam Gandhi', role: 'Design mentor' },
  { head: 'Handles tricky work problems quickly and with clear thinking.', text: 'Kunjan often solved tricky situations that took others much longer. Whether it was a sudden issue or something unexpected, he stayed calm and found solutions quickly. He’s someone you can trust when things get complicated.', name: 'Vinay Kapoor', role: 'Owner, T-shirt brand' },
  { head: 'Works with deep focus and delivers solid results every time.', text: 'Kunjan stays laser-focused until the work is done. He doesn’t get distracted or waste time, just quietly gets the job done. His consistent work ethic and dedication made a big difference to our team’s overall flow.', name: 'Dr. Goyel', role: 'Dermatologist, haircare & skincare brand owner' },
  { head: 'Technically sound with deep knowledge of Photoshop workflows.', text: 'Kunjan’s technical grip on Photoshop is impressive. From layout handling to creative adjustments and visual precision, he uses the tool like second nature. His command over design software adds speed and confidence to the workflow.', name: 'Hemang Rami', role: 'Digital Marketing Specialist' },
  { head: 'Delivers even under pressure without losing clarity or calm.', text: 'Kunjan managed multiple tasks smoothly, even under tight deadlines. He stayed calm, focused, and delivered everything on time. His ability to handle pressure helped the team stay organized and move forward confidently.', name: 'Bhavesh Patel', role: 'Founder, design company' },
]

// Drop a photo named after the person (e.g. priyanka-challa.jpg) into src/assets/testimonials/ and it appears automatically.
const PHOTOS = import.meta.glob('../../assets/testimonials/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })
const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const photoOf = (n) => Object.entries(PHOTOS).find(([path]) => path.split('/').pop().replace(/\.\w+$/, '') === slug(n))?.[1]

// Video testimonials: add { name, role, src (mp4 in public/ or a URL), poster } here. Nothing shows until at least one exists.
const VIDEOS = []

const initials = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('')

export default function Testimonials() {
  return (
    <section id="testimonials" className="tm" aria-labelledby="tm-title">
      <Container>
        <p className="tm__label">KIND WORDS / 004</p>
        <h2 id="tm-title" className="tm__title"><span className="line"><Reveal text="WHAT PEOPLE SAY." accentDots /></span></h2>
        <p className="tm__lead">What team members, managers and collaborators have said about working with me.</p>
        <ul className="tm__grid" role="list">
          {ITEMS.map(({ head, text, name, role }) => (
            <li key={name} className="tm__card">
              <h3>{head}</h3>
              <p>{text}</p>
              <div className="tm__who">
                {photoOf(name)
                  ? <img className="tm__av tm__av--img" src={photoOf(name)} alt={name} width="44" height="44" loading="lazy" />
                  : <span className="tm__av" aria-hidden="true">{initials(name)}</span>}
                <span><b>{name}</b><small>{role}</small></span>
              </div>
            </li>
          ))}
        </ul>
        {VIDEOS.length > 0 && (
          <div className="tm__videos">
            <h3 className="tm__vh">In their own words</h3>
            <ul role="list" className="tm__vgrid">
              {VIDEOS.map((v) => (
                <li key={v.name} className="tm__video">
                  <video controls preload="none" playsInline poster={v.poster} src={v.src} aria-label={`Video testimonial from ${v.name}`} />
                  <p><b>{v.name}</b><small>{v.role}</small></p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </section>
  )
}
