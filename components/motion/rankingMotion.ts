'use client'

import { useReducedMotion, type Variants } from 'motion/react'

// Ingresso a cascata della classifica: il 1° appare per primo, poi gli altri
// in ordine. Solo opacity/transform (fluidi anche su Android di fascia bassa);
// con "riduci movimento" resta una dissolvenza breve, senza spostamenti.

const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 320, damping: 28, mass: 0.8 },
  },
}

const reducedListVariants: Variants = {
  hidden: {},
  visible: {},
}

const reducedItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
}

export function useRankingVariants() {
  const shouldReduceMotion = useReducedMotion()

  return shouldReduceMotion
    ? { list: reducedListVariants, item: reducedItemVariants }
    : { list: listVariants, item: itemVariants }
}
