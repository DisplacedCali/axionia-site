/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      {
        /*
          /founding-members was a public page until the founder offer moved
          behind a gate. It was in the sitemap for months, so search engines and
          anyone's bookmarks still point at it.

          Permanent (308) rather than a 404: a 404 strands inbound traffic, and
          a permanent redirect is also what gets the old URL dropped from the
          index fastest — which is the actual goal. /contact is the right
          landing place, since someone arriving here wants to talk to a person.

          The offer itself now lives at /deck/founders, reachable only from a
          staff session or a signed link.
        */
        source: "/founding-members",
        destination: "/contact",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
