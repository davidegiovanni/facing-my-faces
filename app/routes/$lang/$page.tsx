import { json, LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, NavLink, useCatch, useLoaderData, useLocation, useParams } from "@remix-run/react";
import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem, WebLinkModel, WebPageModel, WebSectionModel } from "api/models";
import metadata from '~/utils/metadata'
import link from '~/utils/links'
import { fluidType } from '~/utils/helpers'
import { Attachment } from "~/components/Attachment";
import queryString from 'query-string'

export const links: LinksFunction = () => {
  return link(
    {
      canonical: 'https://facingmyfaces.davidegiovanni.com/it-it'
    }
  )
};

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = 'https://facingmyfaces.davidegiovanni.com' + location.pathname

  if (data !== undefined) {
    const { page } = data as LoaderData;
    title = (page.title !== '' ? page.title : "Homepage")
    description = page.description !== '' ? page.description : page.title !== '' ? page.title : "Facing my faces"
    image = page.image !== '' ? page.image : ''
    url = 'https://facingmyfaces.davidegiovanni.com' + location.pathname
  }

  return metadata(
    {
      title: title,
      description: description,
      image: image,
      url: url,
      robots: 'follow',
      type: 'website',
    }
  )
};

const i18nKeys = ["shared"] as const;
type I18nKeys = typeof i18nKeys[number];

type LoaderData = {
  i18n: Record<I18nKeys, any>;
  page: WebPageModel;
  sections: WebSectionModel[];
  logo: string;
  primary: string;
  secondary: string;
  navbar: WebLinkModel[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  let lang = params.lang === 'it-it' ? 'it-IT' : 'it-IT'

  const [websiteRes, websiteErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/facingmyfaces.davidegiovanni.com?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (websiteErr !== null) {
    throw new Error(`API website: ${websiteErr.message} ${websiteErr.code}`);
  }
  const logo = websiteRes.website.theme.logoUrl
  const primary = websiteRes.website.theme.primaryColor
  const secondary = websiteRes.website.theme.invertedPrimaryColor

  const [pageRes, pageErr] = await safeGet<any>(request, `https://cdn.revas.app/websites/v0/websites/facingmyfaces.davidegiovanni.com/pages/${params.page}?public_key=01exy3y9j9pdvyzhchkpj9vc5w&language_code=${lang}`)
  if (pageErr !== null) {
    throw new Error(`API page: ${pageErr.message} ${pageErr.code}`);
  }

  const page: WebPageModel = pageRes.page

  const sections: WebSectionModel[] = page.sections

  const navbar = websiteRes.website.headerNav.links

  const loaderData: LoaderData = {
    i18n,
    page: page,
    sections: sections,
    primary,
    secondary,
    logo,
    navbar
  }

  return json(loaderData)
};

export default function Page() {
  const { i18n, sections, navbar, secondary } = useLoaderData<LoaderData>();
  const params = useParams()

  function getSlug(url: string) {
    const parsed = queryString.parse(url)
    return parsed.content
  }

  return (
    <div className="bg-white h-full w-full p-4 overflow-y-scroll">
      <div className="absolute top-0 left-0 m-4 z-40 w-16 h-16 mix-blend-multiply">
        <Link to={`/${params.lang}`} className="underline">
          <p className="sr-only">
            Torna indietro
          </p>
          <img src="/icons/arrow.png" alt="" />
        </Link>
      </div>
      {
        sections.map((s, index) => (
          <div className={(index === 0 ? "pt-16 pb-4 " : "py-4 ") + "relative z-20 font-sans max-w-screen-xl mx-auto flex flex-col items-center"}>
            <h1 className="w-full text-center" style={{ fontSize: fluidType(48, 64, 300, 2400, 1.5).fontSize, lineHeight: fluidType(28, 32, 300, 2400, 1.5).lineHeight }}>
              {s.title}
            </h1>
            {s.description !== "" && <h2 className="max-w-screen-md mx-auto text-center mt-4" style={{ fontSize: fluidType(20, 24, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 20, 300, 2400, 1.5).lineHeight }}>
              {s.description}
            </h2>}
            {
              s.primaryLink.title !== '' &&
              <>
                {s.primaryLink.url.includes('https://facingmyfaces.davidegiovanni.com') ?
                  <Link className="inline-block relative z-10 uppercase bg-black text-white rounded-full px-4 py-2 hover:shadow-2xl hover:scale-110 tracking-wide transition ease-in-out delay-150 duration-200 mt-4" to={s.primaryLink.url.replace('https://facingmyfaces.davidegiovanni.com', `/${params.lang}`)}>
                    {s.primaryLink.title}
                  </Link> :
                  <a className="inline-block relative z-10 uppercase bg-black text-white rounded-full px-4 py-2 hover:shadow-2xl hover:scale-110  tracking-wide transition ease-in-out delay-150 duration-200 mt-4" target="_blank" rel="noopener" href={s.primaryLink.url}>{s.primaryLink.title}</a>}
              </>
            }
            {s.image !== "" && <div className="w-full overflow-hidden relative z-0 mt-8">
              <Attachment attachment={{
                id: "",
                mediaType: "image/",
                url: s.image,
                description: ""
              }} />
            </div>}
          </div>
        ))
      }
    </div>
  );
}