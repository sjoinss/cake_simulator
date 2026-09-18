import type { Customer } from "@/lib/gameState";
import { CustomerTable } from "./CustomerTable";

type CustomerSideProps = {
  tables: (Customer | null)[];
};

export function CustomerSide({ tables }: CustomerSideProps) {
  return (
    <section
      aria-label="손님 공간"
      className="flex flex-1 basis-1/2 items-end justify-around gap-2 overflow-hidden bg-[linear-gradient(180deg,var(--theme-primary)_0%,var(--theme-background)_70%)] px-3 pb-4"
    >
      {tables.map((customer, index) => (
        <CustomerTable key={index} tableIndex={index} customer={customer} />
      ))}
    </section>
  );
}
