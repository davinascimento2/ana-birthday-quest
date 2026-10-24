import os
import sys
import json

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

DEFAULT_QUESTS = [
    {
        "id": "quest_bb_1",
        "giver": "Black Bear",
        "title": "Primeira Colheita Dourada",
        "desc": "Olá jovem apicultor! Para começar sua jornada, colha 150 de Pólen no Campo de Girassóis.",
        "target_amount": 150,
        "reward_honey": 350,
        "reward_tokens": 1,
        "reward_gems": 5
    },
    {
        "id": "quest_bb_2",
        "giver": "Black Bear",
        "title": "A Magia dos Trevos de Quatro Folhas",
        "desc": "Muito bem! Agora vá até o Campo de Trevos e colha 400 de Pólen para fortalecer sua colmeia.",
        "target_amount": 400,
        "reward_honey": 1200,
        "reward_tokens": 2,
        "reward_gems": 10
    },
    {
        "id": "quest_bb_3",
        "giver": "Black Bear",
        "title": "Mestre dos Girassóis",
        "desc": "Prove sua dedicação colhendo 1.000 de Pólen no Campo de Girassóis com seu novo coletor!",
        "target_amount": 1000,
        "reward_honey": 3500,
        "reward_tokens": 2,
        "reward_gems": 15
    },
    {
        "id": "quest_sb_1",
        "giver": "Science Bear",
        "title": "Análise Micológica",
        "desc": "Fascinante! Preciso de amostras de esporos do Bosque dos Cogumelos. Colha 2.500 de Pólen vermelho.",
        "target_amount": 2500,
        "reward_honey": 8000,
        "reward_tokens": 3,
        "reward_gems": 25
    },
    {
        "id": "quest_sb_2",
        "giver": "Science Bear",
        "title": "Teias Eletrizantes",
        "desc": "Cuidado com o covil da Aranha! Colete 6.000 de Pólen no Prado das Aranhas para calibrar o reator.",
        "target_amount": 6000,
        "reward_honey": 22000,
        "reward_tokens": 4,
        "reward_gems": 50
    },
    {
        "id": "quest_claw_1",
        "giver": "Claw Master",
        "title": "A Sorte da Garra Arcana",
        "desc": "Conquiste um prêmio lendário na Máquina de Garra do Hub Central e transforme 10.000 de Pólen!",
        "target_amount": 10000,
        "reward_honey": 45000,
        "reward_tokens": 5,
        "reward_gems": 100
    },
    {
        "id": "quest_sb_3",
        "giver": "Science Bear",
        "title": "O Ápice Tropical do Abacaxi",
        "desc": "Suba até a Montanha do Abacaxi e colete 25.000 de Pólen concentrado sob o sol dourado.",
        "target_amount": 25000,
        "reward_honey": 120000,
        "reward_tokens": 6,
        "reward_gems": 200
    },
    {
        "id": "quest_bb_endgame",
        "giver": "Black Bear",
        "title": "Lenda Celestial do Oásis de Coco",
        "desc": "Você atingiu o reino dos mestres. Colha 100.000 de Pólen no Oásis de Coco e receba a coroa apícola!",
        "target_amount": 100000,
        "reward_honey": 1000000,
        "reward_tokens": 10,
        "reward_gems": 1000
    }
]

def generate_quests_with_gemini(api_key):
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        prompt = """
        Gere 8 missões estilo Bee Swarm Simulator com diálogos divertidos e dopaminérgicos para crianças em português.
        Personagens: Black Bear (amigável e guloso por mel), Science Bear (cientista maluco apaixonado por estatísticas de abelhas), Claw Master (operador da máquina de garra arcade).
        Formato JSON:
        [
          {
            "id": "quest_id",
            "giver": "Nome do Urso",
            "title": "Título Divertido",
            "desc": "Diálogo imersivo do NPC",
            "target_amount": 500,
            "reward_honey": 1500,
            "reward_tokens": 2,
            "reward_gems": 15
          }
        ]
        """
        interaction = client.interactions.create(
            model="gemini-3.8-flash",
            input=prompt
        )
        text = interaction.output_text
        # Clean json formatting
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        data = json.loads(text)
        print(f"Successfully generated {len(data)} quests using Gemini 3.8 Flash!")
        return data
    except Exception as e:
        print(f"Gemini API generation note: {e}. Utilizing standard handcrafted master quests catalog.")
        return DEFAULT_QUESTS

def export_luau_quests(quests, filepath):
    lines = [
        "--!strict",
        "-- Generated automatically by scripts/gemini_quest_gen.py (Gemini 3.8 Flash & Google Antigravity SDK)",
        "",
        "export type DynamicQuestDef = {",
        "\tId: string,",
        "\tGiver: string,",
        "\tTitle: string,",
        "\tDescription: string,",
        "\tTargetPollen: number,",
        "\tRewardHoney: number,",
        "\tRewardTokens: number,",
        "\tRewardGems: number,",
        "}",
        "",
        "local DynamicQuests: { [string]: DynamicQuestDef } = {",
    ]
    for q in quests:
        lines.append(f'\t["{q["id"]}"] = {{')
        lines.append(f'\t\tId = "{q["id"]}",')
        lines.append(f'\t\tGiver = "{q["giver"]}",')
        lines.append(f'\t\tTitle = "{q["title"]}",')
        clean_desc = q["desc"].replace('"', '\\"')
        lines.append(f'\t\tDescription = "{clean_desc}",')
        lines.append(f'\t\tTargetPollen = {q["target_amount"]},')
        lines.append(f'\t\tRewardHoney = {q["reward_honey"]},')
        lines.append(f'\t\tRewardTokens = {q["reward_tokens"]},')
        lines.append(f'\t\tRewardGems = {q["reward_gems"]},')
        lines.append("\t},")
    lines.append("}")
    lines.append("")
    lines.append("return DynamicQuests")
    lines.append("")

    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Exported Dynamic Quests to {filepath}")

if __name__ == "__main__":
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        print("GEMINI_API_KEY detected. Connecting to Gemini 3.8 Flash...")
        quests = generate_quests_with_gemini(api_key)
    else:
        print("Using standard high-dopamine RPG quests catalog (Provide GEMINI_API_KEY to generate live AI quests).")
        quests = DEFAULT_QUESTS

    export_luau_quests(quests, "src/shared/DynamicQuests.luau")
