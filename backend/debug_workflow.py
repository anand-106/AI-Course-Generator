
import asyncio
from agent.agent import run_workflow_stream

async def test_workflow():
    prompt = "Learn Python Basics"
    print(f"Starting workflow for: {prompt}")
    
    try:
        async for chunk in run_workflow_stream(prompt, single_step=True):
            print(f"Chunk received: {list(chunk.keys())}")
            for node, updates in chunk.items():
                if node == "finalize_course":
                    print("HIT finalize_course!")
                    course = updates.get("course")
                    if course:
                        print(f"Course object present. specific keys: {list(course.keys())}")
                    else:
                        print("Course object MISSING in updates")
    except Exception as e:
        print(f"Runtime error: {e}")

if __name__ == "__main__":
    asyncio.run(test_workflow())
