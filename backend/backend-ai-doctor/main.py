from __future__ import annotations
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    llm
)
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import openai
from dotenv import load_dotenv
from agent_api import AssistentFunction
from prompts import WELCOME_MESSAGE, INSTRUCTIONS
import os

load_dotenv()

async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.SUBSCRIBE_ALL)
    await ctx.wait_for_participant()

    model = openai.realtime.RealtimeModel(
        instructions=INSTRUCTIONS,
        voice="alloy",
        temperature=0.8,
        modalities=["audio", "text"]
    )
    assistant_fnc = AssistentFunction()
    
    agent = Agent(
        instructions=INSTRUCTIONS,
        tools=[assistant_fnc]
    )
    
    session = AgentSession(
        llm=model
    )
    
    await session.start(agent, room=ctx.room)

    session.generate_reply(instructions=WELCOME_MESSAGE)

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))