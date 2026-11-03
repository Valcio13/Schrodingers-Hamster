# Schrödinger's Hamster — Asset & License Documentation

This document records the visual assets, audio routines, procedural rendering generators, icons, and typography used in **Schrödinger's Hamster** (Version 1.0).

---

### 1. Procedural Pixel-Art Graphics & Sprites

| Asset Name | Type / Implementation | Source / Creator | License | Location / Usage |
|---|---|---|---|---|
| **Base Hamsters (6 Species)** | Programmatic SVG Vector Pixel Art | Original implementation by project team | Proprietary / CC0 compatible | `src/components/PixelHamster.tsx` |
| **Quantum Hybrids (Procedural)** | Deterministic Genome PRNG & SVG Pixel-Art Renderer | Original implementation by project team | Proprietary / CC0 compatible | `src/components/PixelHybridHamster.tsx`, `src/utils/hybridGenerator.ts` |
| **Laboratory Environment Room** | Pure CSS & SVG 2D Pixel Architecture | Original implementation by project team | Proprietary / CC0 compatible | `src/components/LabEnvironment.tsx`, `src/index.css` |
| **Schrödinger's Lab Concept Scene** | 16:9 Pixel-Art Laboratory Environment Artwork | Original concept illustration for Schrödinger's Hamster | Proprietary / CC0 compatible | `public/assets/schrodingers_hamster_lab.jpg` |
| **Kinetic Hamster Dynamo** | Mechanical Wheel, A-frame & Copper Generator Sprite | Original implementation by project team | Proprietary / CC0 compatible | `src/components/pixel-art/PixelKineticWheel.tsx` |
| **Schrödinger Quantum Vault** | Reinforced Vault, Viewport & Beacon Sprite | Original implementation by project team | Proprietary / CC0 compatible | `src/components/pixel-art/PixelQuantumVault.tsx` |
| **Quantum Incubation Vessel** | Brass & Borosilicate Genetic Synthesizer Sprite | Original implementation by project team | Proprietary / CC0 compatible | `src/components/pixel-art/PixelIncubationVessel.tsx` |
| **Research Workbench Desk** | Physical Desk, Banker's Lamp, CRT & Hamster Perch | Original implementation by project team | Proprietary / CC0 compatible | `src/components/pixel-art/PixelWorkbenchDesk.tsx` |
| **Quantum Egg & Hatch Animation** | CSS Keyframe Pixel Animation | Original implementation by project team | Proprietary / CC0 compatible | `src/components/QuantumIncubator.tsx`, `src/index.css` |

---

### 2. Audio & Sound Design

| Sound Routine | Implementation Method | Source / Creator | License | Location / Usage |
|---|---|---|---|---|
| **Synthesized Audio System** | Browser Native Web Audio API (`AudioContext`, OscillatorNode, GainNode) | Custom algorithmic synthesis (no external MP3/WAV files) | Proprietary / CC0 compatible | `src/services/audio.ts` |
| **Soft UI Click** | 440Hz -> 880Hz Sine ramp | Algorithmic Web Audio | CC0 | `audio.playClick()` |
| **Kinetic Zap & Charge** | Sawtooth & Triangle frequency sweeps | Algorithmic Web Audio | CC0 | `audio.playZap()`, `audio.playCharge()` |
| **Discovery Chime** | C4-E5 Pentatonic arpeggio sequence | Algorithmic Web Audio | CC0 | `audio.playDiscovery()` |
| **Egg Cracking Sequence** | Multi-frequency ascending burst | Algorithmic Web Audio | CC0 | `audio.playEggCrack()` |
| **Rare Reveal Fanfare** | E4-C#6 Stellar major triad arpeggio | Algorithmic Web Audio | CC0 | `audio.playRareReveal()` |
| **Quantum Collapse Reality Bend** | 600Hz -> 80Hz Sawtooth exponential dive | Algorithmic Web Audio | CC0 | `audio.playQuantumCollapse()` |
| **Anomaly Warning Buzz** | 120Hz -> 60Hz Low sawtooth descending drone | Algorithmic Web Audio | CC0 | `audio.playError()` |

---

### 3. Open-Source Libraries & Icons

| Package | Purpose | Creator / Source | License | Usage |
|---|---|---|---|---|
| **lucide-react** | Clean minimalist iconography | Lucide Contributors (https://github.com/lucide-icons/lucide) | ISC License | Laboratory controls, badges, buttons across all components |
| **canvas-confetti** | Celebration visual particle effect | Kiril Vatev (https://github.com/catdad/canvas-confetti) | MIT License | Milestone discoveries, rare hybrid hatching, Grand Paradox finale |

---

### 4. Typography

| Font Family | Source | License | Usage |
|---|---|---|---|
| **Fredoka** | Google Fonts | SIL Open Font License, 1.1 | Display headings & celebratory numbers |
| **Pixelify Sans** | Google Fonts | SIL Open Font License, 1.1 | Retro pixel-art indicators & badges |
| **JetBrains Mono** | Google Fonts / JetBrains | SIL Open Font License, 1.1 | Scientific telemetry, state waveforms, & timers |
| **Plus Jakarta Sans** | Google Fonts / Tokotype | SIL Open Font License, 1.1 | Readable UI text, descriptions, and tooltips |

---

*Verified: Zero copyrighted, proprietary, or unlicensed external imagery or audio samples have been introduced.*
