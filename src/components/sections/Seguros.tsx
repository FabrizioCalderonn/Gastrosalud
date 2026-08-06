export function Seguros() {
  return (
    <section id="seguros" className="bg-surface px-6 py-16 md:px-16">
      <div className="mx-auto max-w-[1000px] text-center">
        <div className="mb-2.5 text-[13px] font-bold uppercase tracking-wider text-green">
          Seguros médicos
        </div>
        <h2 className="mb-3 font-heading text-[26px] font-bold text-ink md:text-[30px]">
          Trabajamos con tu aseguradora
        </h2>
        <p className="mb-8 text-[15px] text-muted">
          Aceptamos las principales aseguradoras de El Salvador. También atendemos pacientes
          particulares.
        </p>
        <div className="flex flex-wrap justify-center gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex h-20 w-40 items-center justify-center rounded-xl p-2 text-center font-mono text-[11px] text-faint"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #F2EFE8, #F2EFE8 8px, #EDE7DA 8px, #EDE7DA 16px)",
              }}
            >
              logo aseguradora
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
