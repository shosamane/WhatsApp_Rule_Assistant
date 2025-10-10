# WhatsApp_Rule_Assistant
This is a repository for a webapp to conduct experiments to compare AI assisted rule generation for personal WhatsApp groups using contextual information about the group and generic rules set based on prior knowledge of the LLM.

Overview
--------
This is a static single-page app that:
1) Lets you upload a WhatsApp chat export (.zip or folder) and parses messages.
2) Prompts a server-side LLM to generate candidate rules.
3) Elicits preference of rules from user and displays proportion of generic rules and contextually generated rules

