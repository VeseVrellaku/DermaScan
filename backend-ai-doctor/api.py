from livekit.agents import llm

class AssistentFunction(llm.Toolset):
    def __init__(self):
        super().__init__(id="assistant_fnc")