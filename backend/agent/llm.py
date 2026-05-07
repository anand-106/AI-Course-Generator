import json
import os
import re
import logging
from typing import Any, Dict, List, Optional, Union

try:
    from langchain_openai import AzureChatOpenAI
    from langchain_core.prompts import ChatPromptTemplate
except ImportError:
    AzureChatOpenAI = None
    ChatPromptTemplate = None

logger = logging.getLogger(__name__)

class LLMClient:
    """
    A unified client for interacting with Azure OpenAI LLMs
    with robust JSON parsing capabilities.
    """

    def __init__(self, model: str = "gpt-4o", temperature: float = 0.3):
        # Initialize with Azure model deployment name (e.g., "gpt-4o" or "gpt-4-turbo")
        self.model_name = model
        self.temperature = temperature
        self._llm = None
        self._initialize_llm()

    def _initialize_llm(self) -> None:
        """Initialize the AzureChatOpenAI instance if available."""
        if AzureChatOpenAI:
            api_key = os.getenv("AZURE_OPENAI_API_KEY")
            endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
            api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
            
            if not api_key or not endpoint:
                logger.error("AZURE_OPENAI_API_KEY or AZURE_OPENAI_ENDPOINT environment variables are not set.")
                self._llm = None
                return
            try:
                self._llm = AzureChatOpenAI(
                    azure_deployment=self.model_name,
                    temperature=self.temperature,
                    api_version=api_version,
                    azure_endpoint=endpoint,
                    api_key=api_key,
                )
            except Exception as e:
                logger.error(f"Failed to initialize AzureChatOpenAI: {e}")
                self._llm = None
        else:
            logger.warning("langchain-openai library not installed or import failed. Ensure langchain-openai is installed in the active environment.")

    @property
    def is_available(self) -> bool:
        return self._llm is not None and ChatPromptTemplate is not None

    def invoke(self, system_prompt: str, human_prompt_template: str, input_vars: Dict[str, Any], require_json: bool = True) -> Union[Dict, List, str, None]:
        """
        Executes the LLM chain.
        
        Args:
            system_prompt: The system instruction.
            human_prompt_template: The user query template.
            input_vars: Variables to fill into the human prompt.
            require_json: If True, attempts to parse response as JSON.
            
        Returns:
            Parsed JSON object (if require_json=True) or raw string. None if failure.
        """
        if not self.is_available:
            logger.error("LLM Service is unavailable.")
            return None

        try:
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_prompt),
                ("human", human_prompt_template),
            ])
            
            chain = prompt | self._llm
            response = chain.invoke(input_vars)
            
            raw = response.content if hasattr(response, "content") else str(response)
            
            # Gemini returns content as a list of parts, e.g. [{'type': 'text', 'text': '...'}]
            # Extract all text parts and join them into a single string.
            if isinstance(raw, list):
                content = " ".join(
                    part.get("text", "") if isinstance(part, dict) else str(part)
                    for part in raw
                ).strip()
            else:
                content = str(raw).strip()
            
            if require_json:
                return self._parse_json(content)
            return content
            
        except Exception as e:
            logger.error(f"LLM invocation failed: {e}")
            return None

    def _parse_json(self, text: str) -> Union[Dict, List, None]:
        """
        Robustly parses JSON from LLM output, handling markdown blocks and escapement issues.
        Strategy: try the least-invasive approach first, escalate only on failure.
        """
        if not text:
            return None

        # Step 1: Strip markdown code fences
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        # Step 2: Try direct parse — Gemini output is usually already valid JSON
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # Step 3: Try with strict=False (allows some control chars)
        try:
            return json.loads(cleaned, strict=False)
        except json.JSONDecodeError:
            pass

        # Step 4: Extract JSON object/array substring and retry
        obj_match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
        if obj_match:
            try:
                return json.loads(obj_match.group(1))
            except json.JSONDecodeError:
                try:
                    return json.loads(obj_match.group(1), strict=False)
                except json.JSONDecodeError:
                    pass

        arr_match = re.search(r"(\[.*\])", cleaned, re.DOTALL)
        if arr_match:
            try:
                return json.loads(arr_match.group(1))
            except json.JSONDecodeError:
                try:
                    return json.loads(arr_match.group(1), strict=False)
                except json.JSONDecodeError:
                    pass

        # Step 5: Last resort — fix invalid escape sequences ONLY if previous steps failed
        # This avoids corrupting already-valid JSON from Gemini
        fixed = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', cleaned)
        try:
            return json.loads(fixed)
        except json.JSONDecodeError:
            pass

        logger.warning(f"Failed to parse JSON. Content extracted: {cleaned[:200]}...")
        return None

