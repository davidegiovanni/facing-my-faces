import { json, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, useCatch, useLoaderData, useParams } from "@remix-run/react";
import queryString from 'query-string'

import { safeGet } from "~/utils/safe-post";
import { loadTranslations } from "~/helpers/i18n";
import { Feed, FeedItem } from "api/models";
import metadata from '~/utils/metadata'
import { fluidType, formatDate } from '~/utils/helpers'
import parse from 'html-react-parser'
import { ArrowLeftIcon, ArrowRightIcon, ViewGridAddIcon, ViewGridIcon, XIcon } from '@heroicons/react/outline'
import { Attachment } from "~/components/Attachment";

const i18nKeys = ["shared"] as const;
type I18nKeys = typeof i18nKeys[number];

export const meta: MetaFunction = ({ data, location }) => {
  let title = 'Website error'
  let description = 'The website didn\'t load correctly'
  let image = ''
  let url = 'https://facingmyfaces.davidegiovanni.com' + location.pathname

  if (data !== undefined) {
    const page = data.item
    title = (page.title !== '' ? page.title : "Page") + ' | Facing My Faces'
    description = page.summary !== '' ? page.summary : page.title !== '' ? page.title : "Facing my faces"
    image = page.image !== '' ? page.image : ""
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

type LoaderData = {
  i18n: Record<I18nKeys, any>;
  canonical: string;
  item: FeedItem;
  previous: string;
  current: number;
  next: string;
  portraitImage: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const i18n = loadTranslations<I18nKeys>(params.lang as string, i18nKeys);

  const [feedRes, feedErr] = await safeGet<any>(request, `https://cdn.revas.app/contents/v0/directories/facing-my-faces/feed.json?public_key=01exy3y9j9pdvyzhchkpj9vc5w`)
  if (feedErr !== null) {
    throw new Error(`API Feed: ${feedErr.message}, ${feedErr.code}`);
  }

  const feed: Feed = feedRes
  const slug = params.face
  let foundFace = feed.items.find((i: any) => {
    return i.id.endsWith(slug)
  })
  if (foundFace === undefined) {
    throw new Error("Face undefined");
  }

  function getSlug(url: string) {
    const parsed = queryString.parse(url)
    return parsed.content
  }

  let indexOfItem = feed.items.indexOf(foundFace)
  let nextItemIndex = (indexOfItem !== feed.items.length - 1 && indexOfItem % 2 !== 0) ? indexOfItem + 2 : -1
  let nextItemSlug = nextItemIndex !== -1 ? feed.items[nextItemIndex].id : ''
  let previousItemIndex = (indexOfItem > 0 && indexOfItem % 2 !== 0) ? indexOfItem - 2 : -1
  let previousItemSlug = previousItemIndex !== -1 ? feed.items[previousItemIndex].id : ''
  nextItemSlug = nextItemSlug !== '' ? getSlug(nextItemSlug) as string : ''
  previousItemSlug = previousItemSlug !== '' ? getSlug(previousItemSlug) as string : ''

  const portraitImage = feed.items[indexOfItem - 1].image

  const item: FeedItem = foundFace

  const canonical = `https://facingmyfaces.davidegiovanni.com/${params.lang}/${params.feed}/${params.item}`

  const loaderData: LoaderData = {
    i18n,
    canonical: canonical,
    item: item as FeedItem,
    current: indexOfItem,
    next: nextItemSlug,
    previous: previousItemSlug,
    portraitImage
  }

  return json(loaderData);
};

export default function ItemPage() {
  const { item, portraitImage, next, previous } = useLoaderData<LoaderData>();
  const params = useParams()

  return (
    <div className="h-full w-full overflow-y-auto lg:overflow-y-hidden">
    <div className="grid grid-cols-1 lg:grid-cols-2 h-full w-full">
      <div className="relative z-10 aspect-square lg:aspect-auto flex items-center justify-center p-4 lg:h-full">
        <div className="w-full lg:w-1/2 h-full max-w-screen-md mx-auto">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: item.image,
              description: item.title
            }}></Attachment>
        </div>
      </div>
      <div className="lg:hidden -mt-20 overflow-hidden relative z-50">
        <img src="/icons/divider-hr.png" className="w-full scale-x-150" alt="" />
      </div>
      <div className="relative z-10 -mt-8 lg:mt-0 h-full flex items-start justify-center text-center lg:overflow-y-auto pb-40 lg:pb-20">
        <div className="w-11/12 lg:w-9/12 max-w-screen-xl mx-auto mb-4">
          <div className="h-[20vh] w-full hidden lg:block" />
        <div className="w-1/2 mix-blend-multiply lg:w-1/2 h-full max-w-screen-md mx-auto">
            <Attachment attachment={{
              id: "",
              mediaType: "image/",
              url: portraitImage,
              description: item.title
            }}></Attachment>
        </div>
          <h1 style={{ fontSize: fluidType(48, 64, 300, 2400, 1.5).fontSize, lineHeight: fluidType(28, 32, 300, 2400, 1.5).lineHeight }}>
            { item.title}
          </h1>
          {
            item.summary !== "" &&
            <h2 className="mb-4 mt-4" style={{ fontSize: fluidType(20, 24, 300, 2400, 1.5).fontSize, lineHeight: fluidType(16, 20, 300, 2400, 1.5).lineHeight }}>
              { item.summary}
            </h2>
          }
          { item.content_html !== "" && item.content_html !== undefined &&
            <div className="w-full">
              <article className="block prose max-w-none text-black prose-a:text-blue-500 prose-a:underline-offset-4 prose-blockquote:bg-gray-100 prose-blockquote:p-8 prose-blockquote:border-0 prose-blockquote:prose-p:first-of-type:before:opacity-0 prose-a:visited:text-purple-500 prose-li:marker:text-emerald-500">
                {parse(item.content_html)}
              </article>
            </div>
          }
        </div>
      </div>
      <div className="w-full h-24 fixed inset-x-0 bottom-0 z-30 overflow-hidden">
        <div className="flex h-full w-full relative z-10 items-center justify-between mix-blend-multiply translate-y-2">
        {
          previous !== '' ?
            <Link to={`/${params.lang}/faces/${previous}`} className="block group">
              <p className="sr-only">
                Precedente
              </p>
              <img className="w-20 h-20 group-hover:rotate-6" src="/icons/arrow.png" alt="" />
            </Link> :
            <div className="w-20 h-20"></div>
        }
        <Link to={`/${params.lang}/faces`} className="block group">
          <p className="sr-only">
            Torna indietro
          </p>
          <img className="w-20 h-20 group-hover:rotate-6" src="/icons/home.png" alt="" />
        </Link>
        {
          next !== '' ?
            <Link to={`/${params.lang}/faces/${next}`} className="block group">
              <p className="sr-only">
                Successivo
              </p>
              <img className="w-20 h-20 rotate-180 group-hover:rotate-[170deg]" src="/icons/arrow.png" alt="" />
            </Link> :
            <div className="w-20 h-20"></div>
        }
        </div>
        <img src="/icons/bar.png" className="w-full h-full inset-0 absolute" alt="" />
      </div>
      <img src="/icons/divider.png" alt="" className="hidden lg:block w-16 h-full inset-0 mx-auto fixed" />
    </div>
    </div>
  );
}