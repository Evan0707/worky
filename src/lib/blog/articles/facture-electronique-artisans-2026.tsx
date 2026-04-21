/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";

function Callout({ children, type = "info" }: { children: React.ReactNode; type?: "info" | "warning" | "success" }) {
  const styles = {
    info: "border-blue-500/30 bg-blue-50 dark:bg-blue-500/5 text-blue-700 dark:text-blue-200",
    warning: "border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 text-amber-700 dark:text-amber-200",
    success: "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-200",
  };
  return (
    <div className={`my-6 rounded-xl border p-4 text-[14px] leading-relaxed ${styles[type]}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 mb-4 text-[22px] font-bold tracking-tight text-neutral-900 dark:text-white">
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-8 mb-3 text-[16px] font-semibold text-neutral-700 dark:text-neutral-200">
      {children}
    </h3>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[15px] text-neutral-600 dark:text-neutral-400 leading-[1.75]">
      {children}
    </p>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{children}</strong>;
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="my-4 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-[14px] text-neutral-600 dark:text-neutral-400">
          <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600 shrink-0" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Table() {
  const rows = [
    { date: "1ᵉʳ septembre 2026", who: "Grandes entreprises (> 5 000 salariés)", obligation: "Émettre et recevoir", highlight: false },
    { date: "1ᵉʳ septembre 2027", who: "ETI (250 – 5 000 salariés)", obligation: "Émettre et recevoir", highlight: false },
    { date: "1ᵉʳ septembre 2027", who: "PME, TPE, artisans, micro-entrepreneurs", obligation: "Émettre et recevoir", highlight: true },
    { date: "Dès septembre 2026", who: "TOUS (y compris artisans)", obligation: "Recevoir obligatoire", highlight: true },
  ];
  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-black/[0.08] dark:border-white/[0.06]">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02]">
            <th className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300">Date</th>
            <th className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300">Qui est concerné</th>
            <th className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300">Obligation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 ${row.highlight ? "bg-amber-50/60 dark:bg-amber-500/[0.03]" : ""}`}
            >
              <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 font-medium whitespace-nowrap">{row.date}</td>
              <td className="px-4 py-3 text-neutral-500">{row.who}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  row.obligation === "Émettre et recevoir"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                }`}>
                  {row.obligation}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StepCard({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 my-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/[0.06] dark:bg-white/[0.06] text-[12px] font-bold text-neutral-600 dark:text-neutral-300 mt-0.5">
        {number}
      </div>
      <div>
        <p className="text-[14px] font-semibold text-neutral-800 dark:text-neutral-200 mb-1">{title}</p>
        <p className="text-[14px] text-neutral-500 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

export function ArticleContent({ locale }: { locale: string }) {
  return (
    <div>
      {/* Introduction */}
      <Paragraph>
        La France s'apprête à vivre une révolution silencieuse mais profonde dans la relation
        entre les entreprises et l'administration fiscale. Depuis le 1ᵉʳ janvier 2026, la
        facturation électronique devient progressivement obligatoire pour toutes les entreprises
        françaises assujetties à la TVA — des grands groupes aux artisans en microentreprise.
      </Paragraph>
      <Paragraph>
        Pour un plombier indépendant, un électricien ou un maçon habitué à imprimer ses factures
        sur papier ou à les envoyer en PDF par e-mail, cette réforme peut sembler abstraite. Pourtant,
        elle concerne directement votre activité — et les délais arrivent plus vite qu'on ne le croit.
      </Paragraph>
      <Paragraph>
        Ce guide vous explique, sans jargon, ce qui change vraiment, quand ça s'applique à vous,
        et comment vous y préparer sereinement.
      </Paragraph>

      {/* Section 1 */}
      <SectionTitle>Qu'est-ce que la facturation électronique — et pourquoi le PDF par e-mail ne suffit plus</SectionTitle>
      <Callout type="warning">
        <strong>Attention :</strong> une facture envoyée en PDF par e-mail n'est <strong>pas</strong> une
        facture électronique au sens légal du terme. C'est la confusion la plus fréquente chez les artisans.
      </Callout>
      <Paragraph>
        La facturation électronique, telle que définie par la réforme, exige trois conditions cumulatives :
      </Paragraph>
      <BulletList items={[
        <><Strong>Un format structuré</Strong> — un fichier contenant des données lisibles par machine (pas juste une image ou un PDF visuel)</>,
        <><Strong>Un transit par une plateforme agréée</Strong> — ni par e-mail classique, ni via un drive partagé</>,
        <><Strong>Une traçabilité complète</Strong> — l'administration fiscale peut consulter les données en temps réel</>,
      ]} />
      <Paragraph>
        En clair : votre facture Word exportée en PDF, aussi professionnelle soit-elle, ne sera plus
        conforme. Le changement est profond, mais les outils modernes l'absorbent entièrement — vous
        n'avez pas à devenir expert en XML pour vous conformer.
      </Paragraph>

      {/* Section 2 */}
      <SectionTitle>Le calendrier de la réforme : qui est concerné, et quand ?</SectionTitle>
      <Paragraph>
        La réforme se déploie en vagues successives, par taille d'entreprise. Voici les dates
        officielles au moment de la rédaction de cet article :
      </Paragraph>
      <Table />
      <Callout type="info">
        <strong>Point clé :</strong> même si vous n'avez pas à <em>émettre</em> de factures électroniques
        avant 2027, vous devez pouvoir en <em>recevoir</em> dès septembre 2026. Si votre fournisseur de
        matériaux est une grande enseigne, ses factures arriveront en format structuré — et vous aurez
        besoin d'un outil capable de les traiter.
      </Callout>

      {/* Section 3 */}
      <SectionTitle>Factur-X : le format à retenir pour les artisans</SectionTitle>
      <Paragraph>
        Parmi les formats acceptés par l'administration (Factur-X, UBL, CII…), <Strong>Factur-X</Strong> est
        le plus adapté aux petites entreprises et artisans. Voici pourquoi.
      </Paragraph>
      <Paragraph>
        Factur-X est un fichier PDF/A — visuellement identique à une facture normale — qui contient
        en plus des données XML lisibles automatiquement. Autrement dit : vous voyez un beau document
        PDF. L'administration, elle, lit les données brutes sans aucune saisie manuelle de sa part.
      </Paragraph>
      <Paragraph>
        Les avantages concrets pour un artisan :
      </Paragraph>
      <BulletList items={[
        "Vous continuez à envoyer un document qui ressemble à une vraie facture papier",
        "Votre client peut l'ouvrir dans n'importe quel lecteur PDF",
        "Les données sont automatiquement intégrées dans les logiciels de compta du client",
        "C'est le format natif d'OpenChantier (conforme à la norme européenne EN 16931)",
        "Aucune formation technique requise — votre logiciel génère le fichier pour vous",
      ]} />
      <Paragraph>
        Il existe plusieurs niveaux de conformité Factur-X. Pour un artisan standard, le niveau
        <Strong> EN16931</Strong> (aussi appelé "Comfort") couvre largement toutes les obligations légales.
      </Paragraph>

      {/* Section 4 */}
      <SectionTitle>Les portails autorisés : Chorus Pro et les PDP</SectionTitle>
      <Paragraph>
        Toutes les factures électroniques devront transiter par l'une ou l'autre de ces voies :
      </Paragraph>
      <SubTitle>Le Portail Public de Facturation (PPF)</SubTitle>
      <Paragraph>
        L'héritier de Chorus Pro, géré directement par l'État. Gratuit, mais avec une interface
        qui n'a pas été conçue pour les artisans. Adapté si vous émettez très peu de factures.
      </Paragraph>
      <SubTitle>Les Plateformes de Dématérialisation Partenaires (PDP)</SubTitle>
      <Paragraph>
        Des opérateurs privés agréés par la DGFiP. Avantage principal : ils s'intègrent directement
        dans votre logiciel de gestion. Vous ne changez rien à votre façon de travailler — la plateforme
        envoie la facture pour vous, en arrière-plan.
      </Paragraph>
      <Callout type="success">
        Si vous utilisez un logiciel certifié PDP (comme OpenChantier), vous n'avez pas à vous
        connecter manuellement au portail de l'État. La transmission est entièrement automatique.
      </Callout>

      {/* Section 5 */}
      <SectionTitle>Ce qui change concrètement dans votre quotidien</SectionTitle>
      <Paragraph>
        Au-delà de la technique, voici ce que la réforme modifie dans votre façon de travailler
        au jour le jour :
      </Paragraph>
      <BulletList items={[
        "Vous ne pouvez plus envoyer vos factures uniquement en PDF par e-mail direct",
        "Chaque facture émise doit passer par une plateforme agréée (PDP ou PPF)",
        "L'administration fiscale reçoit une copie automatique de chaque facture — exit la déclaration manuelle de TVA dans de nombreux cas",
        "Votre client reçoit la facture via la plateforme, avec accusé de réception électronique",
        <>Les litiges du type <em>« j'ai pas reçu ta facture »</em> disparaissent — la traçabilité est totale</>,
      ]} />
      <Paragraph>
        La contrepartie positive est réelle : moins de relances informelles, paiements mieux suivis,
        et une relation client plus professionnelle. Certains artisans témoignent d'une réduction des
        délais de paiement après adoption d'un système de facturation structuré.
      </Paragraph>

      {/* Section 6 */}
      <SectionTitle>Les sanctions en cas de non-conformité</SectionTitle>
      <Paragraph>
        Ne pas se conformer à la réforme n'est pas sans risque. L'article 289 bis du Code général
        des impôts prévoit :
      </Paragraph>
      <BulletList items={[
        <><Strong>15 € d'amende par facture non-conforme</Strong></>,
        <><Strong>Plafonnée à 15 000 € par an</Strong></>,
        "Contrôle fiscal facilité, car toutes les données sont désormais centralisées et consultables en temps réel par l'administration",
        "Une période de tolérance est prévue pour les erreurs de bonne foi en 2026, mais il ne faut pas en dépendre",
      ]} />

      {/* Section 7 */}
      <SectionTitle>Comment se préparer dès aujourd'hui : plan en 4 étapes</SectionTitle>
      <Paragraph>
        Pas besoin de tout changer du jour au lendemain. Voici un plan actionnable pour un artisan
        qui part de zéro :
      </Paragraph>
      <div className="my-6 space-y-2">
        <StepCard number={1} title="Vérifiez votre statut TVA">
          Seules les entreprises assujetties à la TVA sont pleinement concernées. Si vous êtes en
          franchise en base de TVA (micro-entrepreneur non assujetti), les obligations sont allégées.
          En cas de doute, consultez votre expert-comptable.
        </StepCard>
        <StepCard number={2} title="Choisissez un logiciel conforme Factur-X">
          Votre outil de facturation doit générer des fichiers Factur-X et les transmettre via une PDP.
          La plupart des logiciels classiques (Word, Google Docs, Excel) ne le feront jamais — ils ne
          peuvent pas produire le XML structuré requis. OpenChantier génère nativement du Factur-X
          EN16931 pour chaque facture.
        </StepCard>
        <StepCard number={3} title="Adoptez les nouvelles habitudes maintenant">
          Même si l'obligation pour les artisans s'applique en 2027, commencer à utiliser un outil
          conforme en 2026 vous donne 12 mois pour prendre vos marques sans pression. Moins de
          surprise, zéro risque d'amende, et vous serez déjà rodé quand vos confrères paniqueront.
        </StepCard>
        <StepCard number={4} title="Informez votre expert-comptable">
          Cette réforme change aussi la façon dont votre comptable reçoit vos données. Un logiciel
          certifié peut lui transmettre directement les flux — moins de saisie manuelle pour lui,
          moins de frais de tenue de comptabilité pour vous.
        </StepCard>
      </div>

      {/* Conclusion */}
      <SectionTitle>Conclusion : une contrainte qui cache une opportunité</SectionTitle>
      <Paragraph>
        La facturation électronique est souvent présentée comme une contrainte administrative de plus.
        En réalité, c'est surtout une opportunité de moderniser votre gestion financière, de gagner
        du temps sur vos relances, et de sécuriser vos paiements.
      </Paragraph>
      <Paragraph>
        Les artisans qui s'y préparent tôt prendront un avantage concurrentiel sur ceux qui
        attendront la dernière minute. La réforme est inévitable — autant en tirer le meilleur parti.
      </Paragraph>

      {/* CTA block */}
      <div className="mt-10 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-neutral-100 dark:bg-white/[0.03] p-8 text-center">
        <p className="text-[13px] font-medium text-neutral-400 uppercase tracking-wider mb-3">OpenChantier</p>
        <h3 className="text-[20px] font-bold text-neutral-900 dark:text-white mb-2">
          Déjà prêt pour la facturation électronique
        </h3>
        <p className="text-[14px] text-neutral-500 max-w-md mx-auto mb-6">
          OpenChantier génère nativement des factures Factur-X (EN 16931) conformes à la réforme.
          Vous n'avez rien de spécial à faire — commencez à facturer correctement dès aujourd'hui.
        </p>
        <Link
          href={`/${locale}/login`}
          className="inline-flex items-center gap-2 rounded-full bg-neutral-900 dark:bg-white px-6 py-2.5 text-[13px] font-semibold text-white dark:text-black hover:opacity-90 transition-opacity"
        >
          Commencer gratuitement →
        </Link>
      </div>
    </div>
  );
}
