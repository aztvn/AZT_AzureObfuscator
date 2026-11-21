<p align="center">
  <img src="./assets/banner.jpg" alt="AZT Obfuscator Azure Banner" width="100%" />
</p>

<h1 align="center">AZT Obfuscator — Azure</h1>

<p align="center">
  High-speed Luau script protection for Roblox, crafted by <strong>AZT Service</strong>.
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/Version-1.0.0-00A2FF.svg" alt="Version 1.0.0" />
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933.svg" alt="Node.js 18+" />
  <a href="https://aztvn.top/discord"><img src="https://img.shields.io/badge/Discord-AZT%20Service-5865F2.svg" alt="Discord" /></a>
</p>

## Overview

**AZT Obfuscator Azure (v1.0.0)** is a fast, lightweight Luau protector designed specifically for Roblox projects. Built with zero external runtime dependencies in TypeScript/JavaScript, it processes scripts in milliseconds and delivers clean, ready-to-run output with strong runtime protection.

## Highlights

- **Fast Processing**: Compiles and protects Luau scripts in just a few milliseconds.
- **Built for Roblox Luau**: Seamless compatibility with modern Luau syntax and Roblox environments.
- **Zero External Dependencies**: Runs out of the box on Node.js 18+ with no heavy packages required.
- **Built-in Tamper Protection**: Safeguards scripts against unauthorized environments and tampering.
- **CLI & Programmatic API**: Easy to integrate into local workflows, bots, or build pipelines.

## Quick Start

```bash
# Build the project
npm run build

# Protect a Luau script
node dist/AZT_CLI.mjs examples/sample.luau -o output.lua
```

### Usage in JavaScript / TypeScript

```js
import { AZT_Obfuscate } from "./dist/AZT_Index.mjs";

const result = AZT_Obfuscate(`
  print("Hello from Roblox!")
`);

console.log(result.code);
```

## Community & Support

- Discord: [https://aztvn.top/discord](https://aztvn.top/discord)

## License

Released under the **MIT License**. See [LICENSE](./LICENSE) for details.
