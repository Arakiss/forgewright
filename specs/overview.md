# Forgewright Overview

AI-first release system for the age of AI-assisted development.

## The Problem

Traditional release tools (semantic-release, changesets, release-it) were designed for human development velocity. With Claude Code, Cursor, and Codex, developers produce 50+ commits/day. These tools break under this volume.

## The Solution

Forgewright analyzes VALUE, not patterns. It groups commits into Work Units, calculates a Readiness Score (0-100), and releases when meaningful value exists.

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Work Units** | Coherent bundles of commits that deliver value |
| **Readiness Score** | AI-evaluated score: completeness (40%), value (30%), coherence (20%), stability (10%) |
| **Narrative Changelogs** | Human-readable summaries, not commit lists |

## Current State

- **v0.1.0** - Code complete, never published
- **94% test coverage** - 287 tests passing
- **8 AI providers** - Anthropic, OpenAI, Google, xAI, Mistral, Ollama, OpenAI-compatible
- **3 packages** - @forgewright/core, @forgewright/ai, @forgewright/cli

## Target Market

115,000+ Claude Code developers, 1M+ Cursor users, 72% of professional developers using AI assistants.
