# Graph Report - .  (2026-07-11)

## Corpus Check
- Corpus is ~7,678 words - fits in a single context window. You may not need a graph.

## Summary
- 105 nodes · 146 edges · 12 communities (11 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Build Tooling (DevDeps)
- Runtime Dependencies
- App Shell & State
- HTML Entry & Branding
- Package Metadata
- Chat Messaging & API
- README Tooling Notes
- Model Selection & Settings
- File Attachments
- Temp/Scratch

## God Nodes (most connected - your core abstractions)
1. `useStore` - 11 edges
2. `nChat Icon Sprite (social icons)` - 7 edges
3. `scripts` - 6 edges
4. `PROVIDERS` - 6 edges
5. `React + Vite Template` - 6 edges
6. `ChatArea()` - 5 edges
7. `fetchModels()` - 5 edges
8. `nChat Index HTML Entry` - 5 edges
9. `AttachmentPreview()` - 4 edges
10. `ModelPickerModal()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `nChat Index HTML Entry` --references--> `nChat Favicon SVG (purple lightning)`  [EXTRACTED]
  index.html → public/favicon.svg
- `React + Vite Template` --conceptually_related_to--> `nChat Index HTML Entry`  [INFERRED]
  README.md → index.html
- `nChat Favicon SVG (purple lightning)` --semantically_similar_to--> `nChat Icon Sprite (social icons)`  [INFERRED] [semantically similar]
  public/favicon.svg → public/icons.svg
- `WelcomeScreen()` --calls--> `useStore`  [EXTRACTED]
  src/components/ChatArea.jsx → src/store.js
- `ChatArea()` --calls--> `useStore`  [EXTRACTED]
  src/components/ChatArea.jsx → src/store.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **nChat Visual Identity Assets** — public_favicon_svg, public_icons_svg, index_html_title [INFERRED 0.75]

## Communities (12 total, 1 thin omitted)

### Community 0 - "Build Tooling (DevDeps)"
Cohesion: 0.13
Nodes (15): @cloudflare/vite-plugin, oxlint, devDependencies, @cloudflare/vite-plugin, oxlint, @types/react, @types/react-dom, vite (+7 more)

### Community 1 - "Runtime Dependencies"
Cohesion: 0.13
Nodes (15): dependencies, react, react-dom, react-markdown, react-syntax-highlighter, rehype-highlight, remark-gfm, zustand (+7 more)

### Community 2 - "App Shell & State"
Cohesion: 0.23
Nodes (8): App(), WelcomeScreen(), CRTOverlay(), Sidebar(), getInitial(), initial, loadState(), useStore

### Community 3 - "HTML Entry & Branding"
Cohesion: 0.18
Nodes (12): src/main.jsx Entry Script, nChat Index HTML Entry, Root Mount Div, nChat — Personal AI Title, nChat Favicon SVG (purple lightning), nChat Icon Sprite (social icons), Bluesky Icon Symbol, Discord Icon Symbol (+4 more)

### Community 4 - "Package Metadata"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, deploy, dev, lint, preview (+2 more)

### Community 5 - "Chat Messaging & API"
Cohesion: 0.29
Nodes (9): ChatArea(), CopyButton, MarkdownContent, MessageBubble, TypingIndicator, sendMessage(), sendOpenAICompatible(), streamToString() (+1 more)

### Community 6 - "README Tooling Notes"
Cohesion: 0.25
Nodes (8): Oxc, Oxlint, React Compiler, React + Vite Template, SWC, TypeScript Template, @vitejs/plugin-react, @vitejs/plugin-react-swc

### Community 7 - "Model Selection & Settings"
Cohesion: 0.57
Nodes (4): ModelPickerModal(), SettingsModal(), fetchModels(), PROVIDERS

### Community 8 - "File Attachments"
Cohesion: 0.43
Nodes (5): AttachmentPreview(), FileAttachment(), fileToDataUrl(), formatSize(), isImage()

## Knowledge Gaps
- **41 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+36 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime Dependencies` to `Package Metadata`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Build Tooling (DevDeps)` to `Package Metadata`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _41 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Build Tooling (DevDeps)` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._