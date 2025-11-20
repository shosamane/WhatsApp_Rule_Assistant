# WhatsApp_Rule_Assistant
This is a repository for a webapp to conduct experiments to compare AI assisted rule generation for personal WhatsApp groups using contextual information about the group and generic rules set based on prior knowledge of the LLM.

Overview
--------
This is a static single-page app that:
1) Lets you upload a WhatsApp chat export (.zip or folder) and parses messages.
2) Prompts a server-side LLM to generate candidate rules.
3) Elicits preference of rules from user and displays proportion of generic rules and contextually generated rules


Transcript Eligibility Requirements
----------------------------------
To run the experiment, the uploaded WhatsApp chat export must meet all of the following:

- Time span: at least 90 days between the earliest and latest message timestamps.
- Total volume: at least 500 messages in the transcript.
- Participants: at least 3 unique participants (system messages do not count).
- Recent activity: at least 50 messages in the last 30 days (relative to the latest message).

If any of these are not met, the app will block rule generation and show which criteria the transcript violates with the current values.
