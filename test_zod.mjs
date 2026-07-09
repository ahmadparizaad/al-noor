import z from 'zod';

const schema = z.string().url();

const testCases = [
  'https://example.com',
  'http://example.com',
  'ftp://example.com',
  'javascript:alert("xss")',
  'data:text/html,<script>alert("xss")</script>',
];

testCases.forEach(test => {
  const result = schema.safeParse(test);
  console.log(`"${test.substring(0, 30)}" => ${result.success ? 'VALID' : 'INVALID'}`);
});
