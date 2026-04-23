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

function MentionsTable() {
  const rows = [
    { label: "Identité de l'entreprise", detail: "Raison sociale, adresse, SIRET, forme juridique, capital social" },
    { label: "Coordonnées du client", detail: "Nom, prénom, adresse, téléphone (et SIRET si professionnel)" },
    { label: "Numéro et date du devis", detail: "Numérotation unique et chronologique, date d'émission" },
    { label: "Durée de validité", detail: "Généralement 1 à 3 mois après émission" },
    { label: "Description détaillée", detail: "Nature des travaux, matériaux, quantité, unité, prix unitaire" },
    { label: "Prix HT et TTC", detail: "Total HT, taux de TVA applicable, montant TVA, total TTC" },
    { label: "Modalités de paiement", detail: "Acompte, échéances, mode (virement, chèque, CB), délais" },
    { label: "Assurance professionnelle", detail: "RC Pro et décennale avec coordonnées assureur et zone géographique" },
    { label: "Mention de gratuité", detail: "\"Devis gratuit\" si c'est le cas (sinon indiquer le prix)" },
    { label: "Médiation consommateur", detail: "Coordonnées du médiateur (obligation pour travaux chez particulier)" },
  ];
  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-black/[0.08] dark:border-white/[0.06]">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02]">
            <th className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300">Mention</th>
            <th className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300">Détail</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
              <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 font-medium whitespace-nowrap align-top">{row.label}</td>
              <td className="px-4 py-3 text-neutral-500">{row.detail}</td>
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
        Le devis est la première impression qu'un artisan laisse à son client — et souvent la
        dernière, quand il est mal rédigé. Mal structuré, il fait fuir. Incomplet, il ouvre la porte
        aux litiges. Trop vague, il bloque les paiements. Un bon devis, à l'inverse, se signe vite,
        sécurise la relation et pose les bases d'un chantier sans accroc.
      </Paragraph>
      <Paragraph>
        Que vous soyez plombier, électricien, maçon, menuisier ou peintre, les règles sont les mêmes :
        la loi impose un socle de mentions obligatoires, et votre métier exige quelques habitudes
        concrètes pour éviter les pièges classiques. Ce guide fait le tour complet.
      </Paragraph>

      {/* Section 1 */}
      <SectionTitle>Pourquoi le devis est un document juridique — pas un simple « estimatif »</SectionTitle>
      <Paragraph>
        Beaucoup d'artisans considèrent encore le devis comme une estimation indicative, modifiable
        à volonté. C'est une erreur coûteuse. Dès qu'il est <Strong>daté, signé par le client avec la
        mention "bon pour accord"</Strong>, le devis devient un contrat qui vous engage légalement, ainsi
        que votre client. Les prix annoncés sont fermes, la nature des travaux définie, les délais
        opposables.
      </Paragraph>
      <Callout type="warning">
        <strong>À retenir :</strong> un devis signé que vous refusez d'honorer au prix indiqué peut
        donner lieu à des dommages et intérêts. Inversement, un client qui se rétracte après signature
        (hors délai légal de rétractation) peut être poursuivi pour rupture de contrat.
      </Callout>
      <Paragraph>
        Cette force juridique joue dans les deux sens. Bien rédigé, votre devis vous protège contre
        les demandes de travaux « en plus » non chiffrés, contre les négociations de dernière minute
        et contre les impayés mal justifiés.
      </Paragraph>

      {/* Section 2 */}
      <SectionTitle>Les mentions obligatoires exigées par la loi</SectionTitle>
      <Paragraph>
        L'arrêté du 2 mars 1990 et le Code de la consommation fixent une liste précise de mentions
        que tout devis destiné à un particulier doit contenir. Pour les travaux de plus de 150 €, le
        devis écrit est obligatoire. Voici le récapitulatif :
      </Paragraph>
      <MentionsTable />
      <Paragraph>
        Deux mentions méritent une attention particulière car elles sont <Strong>très souvent oubliées</Strong>
        et peuvent invalider le devis en cas de litige : l'assurance décennale et le médiateur
        consommation.
      </Paragraph>

      {/* Section 3 */}
      <SectionTitle>L'assurance décennale : une mention non négociable</SectionTitle>
      <Paragraph>
        Pour tout artisan du bâtiment relevant de la garantie décennale (construction, maçonnerie,
        plomberie, électricité, toiture, menuiserie extérieure, isolation…), votre devis <Strong>doit
        mentionner</Strong> :
      </Paragraph>
      <BulletList items={[
        "Le nom et les coordonnées de votre assureur décennale",
        "Votre numéro de contrat",
        "La zone géographique couverte (souvent votre département + départements limitrophes)",
        "L'intitulé des activités garanties",
      ]} />
      <Paragraph>
        Cette obligation découle de l'article L.241-1 du Code des assurances. Un devis sans mention
        décennale peut être annulé en justice, et surtout, il fait peser tout le risque du chantier
        sur vous en cas de sinistre.
      </Paragraph>

      {/* Section 4 */}
      <SectionTitle>Le médiateur consommation : obligatoire depuis 2016</SectionTitle>
      <Paragraph>
        Depuis l'ordonnance du 20 août 2015 (applicable au 1ᵉʳ janvier 2016), tout professionnel qui
        vend à des particuliers doit adhérer à un dispositif de médiation — et en informer le client
        sur son devis, sa facture et son site internet.
      </Paragraph>
      <Paragraph>
        Concrètement, il suffit d'ajouter un paragraphe du type :
      </Paragraph>
      <div className="my-4 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] p-4 text-[13px] italic text-neutral-500">
        « En cas de litige, le consommateur peut recourir gratuitement au service de médiation
        [nom du médiateur], dont les coordonnées sont : [adresse complète] / [site internet].
        Cette saisine ne peut avoir lieu qu'après une réclamation préalable auprès de notre entreprise. »
      </div>
      <Paragraph>
        Il existe plusieurs médiateurs agréés pour le bâtiment (MCP Médiation, Médiation Professionnelle,
        MEDICYS…). L'adhésion coûte entre 30 et 120 € par an selon l'organisme.
      </Paragraph>

      {/* Section 5 */}
      <SectionTitle>Bien structurer un devis lisible et rassurant</SectionTitle>
      <Paragraph>
        Au-delà des obligations légales, la structure visuelle de votre devis pèse énormément sur
        la décision du client. Un document touffu et mal aéré inquiète ; un document clair rassure.
        Voici la structure qui fonctionne le mieux :
      </Paragraph>
      <SubTitle>1. En-tête avec vos coordonnées complètes</SubTitle>
      <Paragraph>
        Logo visible, raison sociale, adresse, téléphone, email, SIRET, forme juridique. Si votre
        site internet existe, mettez-le — ça rassure sur votre professionnalisme.
      </Paragraph>
      <SubTitle>2. Section « Client »</SubTitle>
      <Paragraph>
        Nom complet, adresse du chantier (souvent différente de l'adresse du client !), coordonnées.
        Préciser l'adresse du chantier évite les confusions si le client a plusieurs biens.
      </Paragraph>
      <SubTitle>3. Lignes de travaux organisées par lot</SubTitle>
      <Paragraph>
        C'est le cœur du devis. Regroupez les prestations par zone (cuisine, salle de bain, chambre)
        ou par corps d'état (plomberie, électricité, peinture). Chaque ligne doit indiquer :
        désignation détaillée, unité (m², ml, heure, forfait), quantité, prix unitaire HT, total HT.
      </Paragraph>
      <SubTitle>4. Totaux clairs en bas de page</SubTitle>
      <Paragraph>
        Total HT, montant de la TVA par taux utilisé, total TTC. Si un acompte est demandé, indiquez
        le montant exact et sa date de règlement.
      </Paragraph>
      <SubTitle>5. Conditions et mentions légales en pied de document</SubTitle>
      <Paragraph>
        Modalités de paiement, pénalités de retard, assurance décennale, médiation, durée de validité.
        Ces mentions peuvent aller en dernière page ou en bas de première page en petit.
      </Paragraph>

      {/* Section 6 */}
      <SectionTitle>Le délai de rétractation : 14 jours pour le client à domicile</SectionTitle>
      <Paragraph>
        Si le devis est signé au domicile du client (démarchage à domicile), la loi Hamon donne au
        consommateur un <Strong>délai de rétractation de 14 jours</Strong> à compter de la signature. Pendant
        cette période, vous ne pouvez pas commencer les travaux ni encaisser le moindre euro — sauf
        si le client signe explicitement une demande d'exécution anticipée.
      </Paragraph>
      <Callout type="info">
        <strong>Bonne pratique :</strong> joindre au devis un formulaire-type de rétractation
        (modèle fourni par le Code de la consommation, article R.221-1). Sans ce formulaire,
        le délai de rétractation s'étend à 12 mois — de quoi transformer un chantier payé en
        créance perdue.
      </Callout>
      <Paragraph>
        En revanche, si le devis est signé dans votre atelier ou à distance (email, plateforme),
        ce délai ne s'applique pas. C'est une bonne raison de systématiquement faire signer vos
        devis au bureau ou en numérique, plutôt qu'en rendez-vous chez le client.
      </Paragraph>

      {/* Section 7 */}
      <SectionTitle>Les 7 erreurs de devis qui coûtent cher</SectionTitle>
      <Paragraph>
        Après avoir vu des centaines de devis artisans, certaines erreurs reviennent en boucle —
        et ce sont précisément celles qui déclenchent les litiges. Voici les plus fréquentes :
      </Paragraph>
      <div className="my-6 space-y-2">
        <StepCard number={1} title="Descriptions vagues (« travaux divers », « fournitures »)">
          Remplacez toujours par une désignation précise avec référence, marque, dimensions, finition.
          Un « robinet salle de bain » devient « mitigeur lavabo Grohe Eurostyle chromé, ref 23374003,
          fourni et posé ».
        </StepCard>
        <StepCard number={2} title="Oublier la durée de validité">
          Sans durée, votre devis peut vous être opposé six mois plus tard, alors que vos prix
          fournisseurs auront changé. Mentionnez systématiquement « Offre valable 30 jours » ou
          « Prix garantis pendant 2 mois ».
        </StepCard>
        <StepCard number={3} title="Ne pas séparer fourniture et main d'œuvre">
          Les particuliers sont souvent tentés de comparer le prix des matériaux. Si tout est
          mélangé, vous paraissez cher. Séparez clairement le poste « fournitures » du poste
          « pose et main d'œuvre ».
        </StepCard>
        <StepCard number={4} title="Appliquer le mauvais taux de TVA">
          Neuf : 20 %. Amélioration logement de plus de 2 ans : 10 %. Rénovation énergétique
          éligible : 5,5 %. Le mauvais taux fait perdre jusqu'à 14,5 points de marge après
          redressement fiscal. En cas de doute, 20 %.
        </StepCard>
        <StepCard number={5} title="Ne pas prévoir les imprévus">
          Ajoutez systématiquement une ligne « provisions pour aléas » de 5 à 10 % du total,
          activable uniquement sur accord du client. Ça évite les avenants à la tête du client
          quand un mur caché cache une mauvaise surprise.
        </StepCard>
        <StepCard number={6} title="Oublier les conditions d'exclusion">
          Préciser ce que le devis ne couvre pas : évacuation des gravats, protection des sols,
          raccordement définitif, finitions des autres corps de métier. Ces « non-dits » sont
          la première cause de conflit en fin de chantier.
        </StepCard>
        <StepCard number={7} title="Envoyer un devis en Word par email">
          Un document modifiable n'a aucune valeur probante. Toujours envoyer en PDF, idéalement
          signé électroniquement ou avec la mention « bon pour accord » manuscrite. Un devis sans
          preuve d'envoi ni preuve d'acceptation ne tient pas en justice.
        </StepCard>
      </div>

      {/* Section 8 */}
      <SectionTitle>Acomptes et paiements : les bonnes pratiques</SectionTitle>
      <Paragraph>
        La loi n'impose aucun montant d'acompte. En pratique, le standard dans le bâtiment est :
      </Paragraph>
      <BulletList items={[
        <><Strong>30 %</Strong> à la signature, pour sécuriser la commande et financer l'achat de matériaux</>,
        <><Strong>40 %</Strong> à mi-parcours ou à une étape clé (par exemple, fin du gros œuvre)</>,
        <><Strong>30 %</Strong> à la réception des travaux, après levée des réserves éventuelles</>,
      ]} />
      <Paragraph>
        Pour les chantiers courts (moins de 5 jours), un acompte unique de 30 % suivi du solde à la
        fin suffit. Pour les chantiers longs, préférez des acomptes mensuels basés sur l'avancement
        réel — c'est votre trésorerie qui vous remerciera.
      </Paragraph>
      <Callout type="success">
        <strong>Astuce :</strong> indiquez systématiquement les pénalités de retard
        (3 × le taux légal pour les particuliers, ou le taux BCE + 10 points pour les pros) ainsi
        que l'indemnité forfaitaire de 40 € pour frais de recouvrement (particuliers ET professionnels,
        article L.441-10 du Code de commerce pour le B2B).
      </Callout>

      {/* Conclusion */}
      <SectionTitle>Conclusion : un bon devis est un chantier à moitié gagné</SectionTitle>
      <Paragraph>
        Rédiger un devis solide demande 15 à 30 minutes de plus qu'un devis bâclé — mais ces minutes
        économisent des heures de négociation, des litiges évités et des paiements plus rapides. Le
        devis n'est pas une formalité administrative : c'est votre premier outil commercial et votre
        meilleur rempart juridique.
      </Paragraph>
      <Paragraph>
        Un artisan qui maîtrise ses devis est un artisan qui signe plus, facture plus vite et se
        fait payer sans accroc. Et dans un métier où la trésorerie est le nerf de la guerre, c'est
        la compétence la mieux rentabilisée de toutes.
      </Paragraph>

      {/* CTA block */}
      <div className="mt-10 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-neutral-100 dark:bg-white/[0.03] p-8 text-center">
        <p className="text-[13px] font-medium text-neutral-400 uppercase tracking-wider mb-3">OpenChantier</p>
        <h3 className="text-[20px] font-bold text-neutral-900 dark:text-white mb-2">
          Des devis professionnels en quelques clics
        </h3>
        <p className="text-[14px] text-neutral-500 max-w-md mx-auto mb-6">
          OpenChantier inclut toutes les mentions obligatoires par défaut, gère les taux de TVA BTP,
          et transforme vos devis signés en factures Factur-X conformes. Vous vous concentrez sur
          le chantier, pas sur la paperasse.
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
