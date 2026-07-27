# USDA FoodData Central MCP server

A stdio MCP server exposing `get_ingredient_nutrition`. It finds the first USDA
Foundation or SR Legacy match for an ingredient, then returns its nutrient data
scaled to an edible gram weight.

## Setup

1. Get a free [FoodData Central API key](https://fdc.nal.usda.gov/api-key-signup.html).
2. Export `FDC_API_KEY` before starting Pi (or set it in the MCP client's environment).

Pi automatically discovers this project's `.mcp.json`, which exposes the tool directly and starts the server on first use. Restart Pi after exporting the key:

```sh
export FDC_API_KEY=your-data-gov-api-key
pi
```

Equivalent MCP configuration:

```json
{
  "mcpServers": {
    "usda-fooddata-central": {
      "command": "bun",
      "args": ["run", "mcp/usda-fooddata-central/server.ts"],
      "cwd": "/absolute/path/to/recipes",
      "env": {
        "FDC_API_KEY": "your-data-gov-api-key"
      }
    }
  }
}
```

Run it manually with:

```sh
FDC_API_KEY=your-data-gov-api-key bun run mcp/usda-fooddata-central/server.ts
```

USDA limits FoodData Central API use to 1,000 requests per hour per IP by
default. The server never logs its API key.
