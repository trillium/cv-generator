<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->

<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
<!--
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->

[![Contributors][contributors-shield]][contributors-url] [![Forks][forks-shield]][forks-url] [![Stargazers][stars-shield]][stars-url] [![Issues][issues-shield]][issues-url] [![MIT License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/trillium/cv-generator">
    <img src="app/icon.svg" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">CV PDF Generator</h3>

  <p align="center">
    An awesome CV PDF generator to jumpstart your resume creation!
    <br />
    <a href="https://github.com/trillium/cv-generator"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/trillium/cv-generator">View Demo</a>
    ·
    <a href="https://github.com/trillium/cv-generator/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    ·
    <a href="https://github.com/trillium/cv-generator/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

The CV PDF Generator is a React app used to build a CV and export it as a PDF.

There are many great CV generators available; however, this one is tailored for personal use with easy PDF export.

Here's why:

- Your time should be focused on creating something amazing. A project that solves a problem and helps others
- You shouldn't be doing the same tasks over and over like creating a CV from scratch
- You should implement DRY principles to the rest of your life :smile:

Of course, no one template will serve all projects since your needs may be different.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

This section should list any major frameworks/libraries used to bootstrap your project.

- [![Next][Next.js]][Next-url]
- [![React][React.js]][React-url]
- [![Tailwind][Tailwind.css]][Tailwind-url]
- [![Puppeteer][Puppeteer.js]][Puppeteer-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

This is an example of how you may give instructions on setting up your project locally. To get a local copy up and running follow these simple example steps.

### Prerequisites

Make sure you have the correct version of Node.js installed. You can use a node version manager that supports `.node-version` file such as [`fnm`](https://github.com/Schniz/fnm).

This project uses [pnpm](https://pnpm.io/) as the package manager, managed via [Corepack](https://nodejs.org/api/corepack.html). Corepack comes bundled with recent Node.js versions and ensures everyone uses the same `pnpm` version as specified in `package.json`.

If you haven't already, enable Corepack:

```sh
corepack enable
```

You do not need to install pnpm globally. Corepack will automatically use the correct version.

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/trillium/cv-generator.git
   ```
2. Install packages
   ```sh
   pnpm install
   ```
3. Add your picture in `src/assets/profile.jpeg`
4. Fill out your information in `data.json`
5. Adapt CSS or scale in `pdf.ts` if needed

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Usage

To generate your CV PDF, run:

```sh
pnpm pdf
```

For development and debugging:

```sh
pnpm dev
```

_For more examples, please refer to the [Documentation](https://github.com/trillium/cv-generator)_

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement". Don't forget to give the project a star! Thanks again!

Here's a quick guide for writing commit messages:

1. Start with a type: Use fix:, feat:, docs:, etc., to indicate the nature of the change.
2. Add a brief description: Follow the type with a concise summary of the change (2-4 words).
3. Optional details: Use a blank line to separate the summary from a longer description if needed.
4. Reference issues: Include issue numbers or tags if applicable
5. Explore conventional commits documentation here: https://kapeli.com/cheat_sheets/Conventional_Commits.docset/Contents/Resources/Documents/index

### Top contributors:

<a href="https://github.com/trillium/cv-generator/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=trillium/cv-generator" alt="contrib.rocks image" />
</a>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

Trillium Smith - [@trillium](https://github.com/trillium) - trillium@trilliumsmith.com

Project Link: [https://github.com/trillium/cv-generator](https://github.com/trillium/cv-generator)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/trillium/cv-generator.svg?style=for-the-badge
[contributors-url]: https://github.com/trillium/cv-generator/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/trillium/cv-generator.svg?style=for-the-badge
[forks-url]: https://github.com/trillium/cv-generator/network/members
[stars-shield]: https://img.shields.io/github/stars/trillium/cv-generator.svg?style=for-the-badge
[stars-url]: https://github.com/trillium/cv-generator/stargazers
[issues-shield]: https://img.shields.io/github/issues/trillium/cv-generator.svg?style=for-the-badge
[issues-url]: https://github.com/trillium/cv-generator/issues
[license-shield]: https://img.shields.io/github/license/trillium/cv-generator.svg?style=for-the-badge
[license-url]: https://github.com/trillium/cv-generator/blob/master/LICENSE
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[Tailwind.css]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Puppeteer.js]: https://img.shields.io/badge/Puppeteer-40B5A4?style=for-the-badge&logo=puppeteer&logoColor=white
[Puppeteer-url]: https://pptr.dev/
