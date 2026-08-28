import React from "react";

export const TryInAgentsBar: React.FC = () => {
  const promptText = "Create an app using @ai-credits/sdk (AI Payment Platform) with user credit wallet and monetized AI features.";
  const encodedPrompt = encodeURIComponent(promptText);

  const agents = [
    {
      name: "Claude",
      href: `https://claude.ai/new?q=${encodedPrompt}`,
      iconSrc: "/agents/claude.svg",
    },
    {
      name: "Codex",
      href: `codex://new?prompt=${encodedPrompt}`,
      iconSrc: "/agents/codex.svg",
    },
    {
      name: "ChatGPT",
      href: `https://chatgpt.com/?q=${encodedPrompt}`,
      iconSrc: "/agents/chatgpt.svg",
    },
    {
      name: "Cursor",
      href: `cursor://new?prompt=${encodedPrompt}`,
      iconSrc: "/agents/cursor.svg",
    },
    {
      name: "Lovable",
      href: `https://lovable.dev/?autosubmit=true&prompt=${encodedPrompt}`,
      iconSrc: "/agents/lovable.svg",
    },
  ];

  return (
    <div className="mt-16 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
      <span className="text-[11px] font-bold font-mono tracking-widest text-zinc-400 uppercase">
        Try in
      </span>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 p-1.5 rounded-2xl bg-[#060a17]/90 border border-blue-500/25 backdrop-blur-xl shadow-lg shadow-blue-950/40">
        {agents.map((agent) => (
          <a
            key={agent.name}
            href={agent.href}
            target="_blank"
            rel="noreferrer"
            title={`Open prompt directly in ${agent.name}`}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#091124] border border-blue-500/20 hover:border-blue-400/70 flex items-center justify-center hover:bg-blue-600/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all group cursor-pointer p-2.5"
          >
            <img
              src={agent.iconSrc}
              alt={agent.name}
              className="w-5 h-5 object-contain group-hover:scale-110 transition-transform"
              loading="lazy"
            />
          </a>
        ))}
      </div>
    </div>
  );
};
