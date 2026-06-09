// Palette de réactions emoji autorisées (chambrage entre collègues).
// Dans un module neutre (PAS "use server") pour pouvoir être importée à la fois
// par l'action serveur et par le composant client <Reactions> : un fichier
// "use server" ne peut exporter que des fonctions async, pas une valeur.
export const REACTION_EMOJIS = ["🔥", "😂", "😱", "🥳", "😭", "💪"] as const;
