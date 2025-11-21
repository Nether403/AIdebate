# AI Debate Arena - Documentation

Welcome to the AI Debate Arena documentation! This directory contains comprehensive guides for using and developing the platform.

## 📚 Documentation Index

### For Users
- **[Transparency Features Guide](TRANSPARENCY_FEATURES.md)** - Quick start guide for data export and statistics features
- **[Data Export API](DATA_EXPORT_API.md)** - Complete API reference for researchers and developers

### For Developers
- **[Project Guide](../.kiro/steering/project-guide.md)** - Architecture and development guidelines
- **[Model Configuration](../.kiro/steering/model-configuration.md)** - LLM model setup and assignments
- **[Authentication Guide](../.kiro/steering/authentication-guide.md)** - Neon Auth implementation details
- **[MCP Activation Guide](../.kiro/steering/mcp-activation-guide.md)** - Task-specific MCP server usage

### For Researchers
- **[Requirements Document](../.kiro/specs/debate-benchmark-platform/requirements.md)** - Detailed feature requirements
- **[Design Document](../.kiro/specs/debate-benchmark-platform/design.md)** - System architecture and design decisions
- **[Data Export API](DATA_EXPORT_API.md)** - Access anonymized debate data for research

## 🚀 Quick Start

### View Public Statistics
Visit `/statistics` to see aggregate platform metrics including:
- Total debates and votes
- Fact-checking accuracy
- Model performance rankings
- Category distribution

### Export Debate Data
```bash
# Export a specific debate
curl https://ai-debate-arena.com/api/debates/{id}/export -o debate.json

# Get anonymized research data
curl "https://ai-debate-arena.com/api/export/anonymized?limit=100" -o data.json

# View public statistics
curl https://ai-debate-arena.com/api/statistics/public
```

### Share Debates
Add share buttons to your debate pages:
```tsx
import { ShareButtons } from '@/components/debate/ShareButtons'

<ShareButtons debateId={debate.id} />
```

## 🎯 Key Features

### Data Export
- **Individual Exports**: Complete debate transcripts with metadata
- **Anonymized Exports**: Privacy-preserving research datasets
- **Public Statistics**: Aggregate platform metrics
- **Featured Debates**: Automatically selected interesting debates

### Social Sharing
- **Share Buttons**: Twitter, Facebook, LinkedIn, Reddit, Email
- **Open Graph Images**: Dynamic preview cards for social media
- **Share Metadata**: Optimized for social platforms

### Transparency
- **Public Dashboard**: Real-time statistics and insights
- **Fact-Check Data**: Accuracy metrics and verification rates
- **Model Performance**: Rankings and win rates
- **Open Data**: Anonymized datasets for research

## 📖 Documentation Structure

```
docs/
├── README.md                      # This file
├── TRANSPARENCY_FEATURES.md       # Quick start guide
└── DATA_EXPORT_API.md            # Complete API reference

.kiro/
├── steering/                      # Development guides
│   ├── project-guide.md
│   ├── model-configuration.md
│   ├── authentication-guide.md
│   └── mcp-activation-guide.md
└── specs/
    └── debate-benchmark-platform/
        ├── requirements.md        # Feature requirements
        ├── design.md             # System design
        ├── tasks.md              # Implementation tasks
        └── TASK-*-SUMMARY.md     # Task summaries
```

## 🔧 Development

### Running Tests
```bash
# Test export features
npm run test:export

# Test LLM integration
npm run test:llm

# Test topic generation
npm run test:topics
```

### Local Development
```bash
# Start dev server
npm run dev

# Run database migrations
npm run db:push

# Seed test data
npm run db:seed
```

## 📊 API Endpoints

### Export Endpoints
- `GET /api/debates/{id}/export` - Export individual debate
- `GET /api/export/anonymized` - Export anonymized data
- `GET /api/statistics/public` - Get public statistics
- `GET /api/debates/featured` - Get featured debate

### Share Endpoints
- `GET /api/debates/{id}/share` - Get share metadata
- `GET /api/debates/{id}/og-image` - Generate OG image

## 🔒 Privacy & Security

### Data Anonymization
Anonymized exports remove:
- User identifiers and session IDs
- IP addresses
- Exact timestamps (only year/month)
- Specific model versions (only families)
- Exact vote counts (only percentages)

### Rate Limits
- Individual exports: 100/hour per IP
- Anonymized exports: 10/hour per IP
- Statistics: 60/hour per IP
- Featured debate: 60/hour per IP

## 📝 Citation

If you use AI Debate Arena data in research, please cite:

```
AI Debate Arena Dataset (2025)
Available at: https://ai-debate-arena.com/api/export/anonymized
Accessed: [Date]
```

## 🤝 Contributing

We welcome contributions! Please see:
- [Project Guide](../.kiro/steering/project-guide.md) for development guidelines
- [GitHub Issues](https://github.com/ai-debate-arena/issues) for bug reports
- [GitHub Discussions](https://github.com/ai-debate-arena/discussions) for questions

## 📧 Contact

- **Research Inquiries**: research@ai-debate-arena.com
- **Technical Support**: support@ai-debate-arena.com
- **General Questions**: hello@ai-debate-arena.com

## 📜 License

This project is licensed under the ISC License. See LICENSE file for details.

## 🗺️ Roadmap

### Current (v1.0)
- ✅ Individual debate exports
- ✅ Anonymized data exports
- ✅ Public statistics dashboard
- ✅ Social sharing features
- ✅ Featured debate selection

### Coming Soon (v1.1)
- [ ] Bulk export API with authentication
- [ ] CSV export format
- [ ] Real-time debate streaming
- [ ] Custom query filters
- [ ] GraphQL API

### Future (v2.0)
- [ ] Debate embedding widgets
- [ ] RSS feeds
- [ ] Webhook notifications
- [ ] Advanced analytics tools
- [ ] Multi-language support

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [LangChain](https://langchain.com/) - LLM orchestration
- [Recharts](https://recharts.org/) - Data visualization
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

**Last Updated**: November 21, 2025
**Version**: 1.0.0
