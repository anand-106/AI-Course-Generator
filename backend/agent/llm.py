import json
import re
import logging
from typing import Any, Dict, List, Optional, Union

try:
    from langchain_ollama import ChatOllama
    from langchain_core.prompts import ChatPromptTemplate
except ImportError:
    ChatOllama = None
    ChatPromptTemplate = None

logger = logging.getLogger(__name__)

class LLMClient:
    """
    A unified client for interacting with Local LLMs (via Ollama) 
    with robust JSON parsing capabilities.
    """

    def __init__(self, model: str = "llama3.1", temperature: float = 0.3):
        self.model_name = model
        self.temperature = temperature
        self._llm = None
        self._initialize_llm()

    def _initialize_llm(self) -> None:
        """Initialize the ChatOllama instance if available."""
        if ChatOllama:
            try:
                self._llm = ChatOllama(
                    model=self.model_name,
                    temperature=self.temperature
                )
            except Exception as e:
                logger.error(f"Failed to initialize ChatOllama: {e}")
                self._llm = None
        else:
            logger.warning("langchain_ollama library not installed or import failed. Ensure langchain-ollama is installed in the active environment.")

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
            
            content = response.content if hasattr(response, "content") else str(response)
            
            if require_json:
                return self._parse_json(content)
            return content.strip()
            
        except Exception as e:
            logger.error(f"LLM invocation failed: {e}")
            return None

    def _parse_json(self, text: str) -> Union[Dict, List, None]:
        """
        Robustly parses JSON from LLM output, handling markdown blocks and escapement issues.
        """
        if not text:
            return None

        # Clean up markdown code blocks
        cleaned_text = text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        elif cleaned_text.startswith("```"):
            cleaned_text = cleaned_text[3:]
        
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
        
        cleaned_text = cleaned_text.strip()

        # Fix invalid escape sequences (common in LLM output)
        # Regex matches backslashes NOT followed by valid JSON escape characters
        cleaned_text = re.sub(r'\\(?![\\/bfnrt"]|u[0-9a-fA-F]{4})', r'\\\\', cleaned_text)

        # 1. Try direct parsing
        try:
            return json.loads(cleaned_text, strict=False)
        except json.JSONDecodeError:
            pass

        # 2. Extract JSON object
        object_match = re.search(r"(\{.*\})", cleaned_text, re.DOTALL)
        if object_match:
            try:
                return json.loads(object_match.group(1), strict=False)
            except json.JSONDecodeError:
                pass

        # 3. Extract JSON array
        array_match = re.search(r"(\[.*\])", cleaned_text, re.DOTALL)
        if array_match:
            try:
                return json.loads(array_match.group(1), strict=False)
            except json.JSONDecodeError:
                pass

        logger.warning(f"Failed to parse JSON. Content extracted: {cleaned_text[:200]}...")
        return None
