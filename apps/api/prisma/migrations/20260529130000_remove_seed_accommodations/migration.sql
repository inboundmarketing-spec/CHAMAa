-- Remove alojamentos placeholder criados automaticamente pelo seed (não cadastrados manualmente).
DELETE FROM "accommodations"
WHERE "address" LIKE '%(cadastrar endereço no painel)%';
