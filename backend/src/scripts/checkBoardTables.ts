import { prisma } from "../lib/prismaClient";

async function main() {
  const rows = await prisma.$queryRawUnsafe<
    { board_roles: string | null; board_members: string | null; board_mandates: string | null }[]
  >(
    "SELECT to_regclass('public.board_roles')::text as board_roles, to_regclass('public.board_members')::text as board_members, to_regclass('public.board_mandates')::text as board_mandates;"
  );
  console.log(rows);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

