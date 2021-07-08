import * as React from 'react';
import { Dialog, Menu, Transition } from '@headlessui/react';
import {
  DotsVerticalIcon,
  DuplicateIcon,
  HomeIcon,
  MenuAlt2Icon,
  PencilAltIcon,
  TrashIcon,
  UserAddIcon,
  UsersIcon,
  XIcon,
} from '@heroicons/react/outline';
import clsx from 'clsx';
import { Link, redirect, useRouteData } from 'remix';
import { Prisma } from '@prisma/client';
import { json } from 'remix-utils';

import { withSession } from '../lib/with-session';
import { prisma } from '../db';

import type { LoaderFunction, RouteComponent } from 'remix';

const userData = Prisma.validator<Prisma.UserArgs>()({
  select: {
    username: true,
    givenName: true,
    familyName: true,
    teams: {
      select: {
        id: true,
        name: true,
        featureChannels: {
          select: {
            id: true,
            updatedAt: true,
            name: true,
            slug: true,
          },
        },
        members: {
          select: {
            id: true,
            givenName: true,
            familyName: true,
            fullName: true,
          },
        },
      },
    },
  },
});

type UserData = Prisma.UserGetPayload<typeof userData>;

interface RouteData {
  user: UserData;
}

const loader: LoaderFunction = ({ request }) =>
  withSession(request, async session => {
    const userId = session.get('userId') as string | undefined;
    if (!userId) {
      return redirect('/login');
    }

    const useNewDashboard = await prisma.flag.findUnique({
      where: {
        feature: 'UseNewDashboard',
      },
    });

    if (!useNewDashboard || useNewDashboard.value === 'false') {
      return redirect('/');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      ...userData,
    });

    if (!user) {
      return redirect('/login');
    }

    return json<RouteData>({ user });
  });

const DashboardPage: RouteComponent = () => {
  const data = useRouteData<RouteData>();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const initials =
    data.user.givenName.slice(0, 1) + data.user.familyName.slice(0, 1);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: true },
    { name: 'Teams', href: '/team', icon: UsersIcon, current: false },
    // { name: 'Projects', href: '#', icon: FolderIcon, current: false },
    // { name: 'Calendar', href: '#', icon: CalendarIcon, current: false },
    // { name: 'Documents', href: '#', icon: InboxIcon, current: false },
    // { name: 'Reports', href: '#', icon: ChartBarIcon, current: false },
  ];
  const userNavigation = [
    { name: 'Your Profile', href: `/${data.user.username}` },
    { name: 'Settings', href: '/settings' },
    { name: 'Sign out', href: '/logout' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Transition.Root show={sidebarOpen} as={React.Fragment}>
        <Dialog
          as="div"
          static
          className="fixed inset-0 z-40 flex md:hidden"
          open={sidebarOpen}
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={React.Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>
          <Transition.Child
            as={React.Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex flex-col flex-1 w-full max-w-xs pt-5 pb-4 bg-indigo-700">
              <Transition.Child
                as={React.Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 right-0 pt-2 -mr-12">
                  <button
                    type="button"
                    className="flex items-center justify-center w-10 h-10 ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XIcon className="w-6 h-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              <div className="flex items-center flex-shrink-0 px-4">
                <img
                  className="w-auto h-8"
                  src="https://tailwindui.com/img/logos/workflow-logo-indigo-300-mark-white-text.svg"
                  alt="Workflow"
                />
              </div>
              <div className="flex-1 h-0 mt-5 overflow-y-auto">
                <nav className="px-2 space-y-1">
                  {navigation.map(item => (
                    <a
                      key={item.name}
                      href={item.href}
                      className={clsx(
                        item.current
                          ? 'bg-indigo-800 text-white'
                          : 'text-indigo-100 hover:bg-indigo-600',
                        'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                      )}
                    >
                      <item.icon
                        className="w-6 h-6 mr-4 text-indigo-300"
                        aria-hidden="true"
                      />
                      {item.name}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          </Transition.Child>
          <div className="flex-shrink-0 w-14" aria-hidden="true">
            {/* Dummy element to force sidebar to shrink to fit close icon */}
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden bg-indigo-700 md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <img
                className="w-auto h-8"
                src="https://tailwindui.com/img/logos/workflow-logo-indigo-300-mark-white-text.svg"
                alt="Workflow"
              />
            </div>
            <div className="flex flex-col flex-1 mt-5">
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map(item => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      item.current
                        ? 'bg-indigo-800 text-white'
                        : 'text-indigo-100 hover:bg-indigo-600',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                    )}
                  >
                    <item.icon
                      className="w-6 h-6 mr-3 text-indigo-300"
                      aria-hidden="true"
                    />
                    {item.name}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <div className="relative z-10 flex flex-shrink-0 h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 text-gray-500 border-r border-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <MenuAlt2Icon className="w-6 h-6" aria-hidden="true" />
          </button>
          <div className="flex justify-end flex-1 px-4">
            <div className="flex items-center">
              {/* Profile dropdown */}
              <Menu as="div" className="relative ml-3">
                {({ open }) => (
                  <>
                    <div>
                      <Menu.Button className="flex items-center max-w-xs text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <span className="sr-only">Open user menu</span>
                        <div className="flex items-center justify-center w-8 h-8 bg-pink-400 rounded-full">
                          {initials}
                        </div>
                      </Menu.Button>
                    </div>
                    <Transition
                      show={open}
                      as={React.Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items
                        static
                        className="absolute right-0 w-48 py-1 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                      >
                        {userNavigation.map(item => (
                          <Menu.Item key={item.name}>
                            {({ active }) => (
                              <a
                                href={item.href}
                                className={clsx(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                {item.name}
                              </a>
                            )}
                          </Menu.Item>
                        ))}
                      </Menu.Items>
                    </Transition>
                  </>
                )}
              </Menu>
            </div>
          </div>
        </div>

        <main className="relative flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">
                Dashboard
              </h1>
            </div>
            <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
              {/* Replace with your content */}
              {/* Projects table (small breakpoint and up) */}
              <div className="hidden mt-8 sm:block">
                <div className="inline-block min-w-full align-middle border-b border-gray-200">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-t border-gray-200">
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b border-gray-200 bg-gray-50">
                          <span className="lg:pl-2">Project</span>
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b border-gray-200 bg-gray-50">
                          Members
                        </th>
                        <th className="hidden px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200 md:table-cell bg-gray-50">
                          Last updated
                        </th>
                        <th className="py-3 pr-6 text-xs font-medium tracking-wider text-right text-gray-500 uppercase border-b border-gray-200 bg-gray-50" />
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {data.user.teams.map(team => (
                        <React.Fragment key={team.id}>
                          {team.featureChannels.map(channel => (
                            <tr key={channel.id}>
                              <td className="w-full px-6 py-3 text-sm font-medium text-gray-900 max-w-0 whitespace-nowrap">
                                <div className="flex items-center space-x-3 lg:pl-2">
                                  <div
                                    className={clsx(
                                      'flex-shrink-0 w-2.5 h-2.5 rounded-full bg-pink-500'
                                    )}
                                    aria-hidden="true"
                                  />
                                  <Link
                                    to={`/channel/${team.id}/${channel.slug}`}
                                    className="truncate hover:text-gray-600"
                                  >
                                    <span>{channel.name}</span>{' '}
                                    <span className="font-normal text-gray-500">
                                      in {team.name}
                                    </span>
                                  </Link>
                                </div>
                              </td>
                              <td className="px-6 py-3 text-sm font-medium text-gray-500">
                                <div className="flex items-center space-x-2">
                                  <div className="flex flex-shrink-0 -space-x-1">
                                    {team.members.map(member => (
                                      <div
                                        key={member.id}
                                        className="w-6 h-6 rounded-full max-w-none ring-2 ring-white"
                                      >
                                        {member.givenName.slice(0, 1)}
                                        {member.familyName.slice(0, 1)}
                                      </div>
                                    ))}
                                  </div>
                                  {/* {project.totalMembers > project.members.length ? (
                                    <span className="flex-shrink-0 text-xs font-medium leading-5">
                                      +
                                      {project.totalMembers -
                                        project.members.length}
                                    </span>
                                  ) : null} */}
                                </div>
                              </td>
                              <td className="hidden px-6 py-3 text-sm text-right text-gray-500 md:table-cell whitespace-nowrap">
                                {channel.updatedAt}
                              </td>
                              <td className="pr-6">
                                <Menu
                                  as="div"
                                  className="relative flex items-center justify-end"
                                >
                                  {({ open }) => (
                                    <>
                                      <Menu.Button className="inline-flex items-center justify-center w-8 h-8 text-gray-400 bg-white rounded-full hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                                        <span className="sr-only">
                                          Open options
                                        </span>
                                        <DotsVerticalIcon
                                          className="w-5 h-5"
                                          aria-hidden="true"
                                        />
                                      </Menu.Button>
                                      <Transition
                                        show={open}
                                        as={React.Fragment}
                                        enter="transition ease-out duration-100"
                                        enterFrom="transform opacity-0 scale-95"
                                        enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="transform opacity-100 scale-100"
                                        leaveTo="transform opacity-0 scale-95"
                                      >
                                        <Menu.Items
                                          static
                                          className="absolute top-0 z-10 w-48 mx-3 mt-1 origin-top-right bg-white divide-y divide-gray-200 rounded-md shadow-lg right-7 ring-1 ring-black ring-opacity-5 focus:outline-none"
                                        >
                                          <div className="py-1">
                                            <Menu.Item>
                                              {({ active }) => (
                                                <Link
                                                  to={`/channel/${team.id}/${channel.slug}/edit`}
                                                  className={clsx(
                                                    active
                                                      ? 'bg-gray-100 text-gray-900'
                                                      : 'text-gray-700',
                                                    'group flex items-center px-4 py-2 text-sm'
                                                  )}
                                                >
                                                  <PencilAltIcon
                                                    className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500"
                                                    aria-hidden="true"
                                                  />
                                                  Edit
                                                </Link>
                                              )}
                                            </Menu.Item>
                                            <Menu.Item>
                                              {({ active }) => (
                                                <a
                                                  href="./"
                                                  className={clsx(
                                                    active
                                                      ? 'bg-gray-100 text-gray-900'
                                                      : 'text-gray-700',
                                                    'group flex items-center px-4 py-2 text-sm'
                                                  )}
                                                >
                                                  <DuplicateIcon
                                                    className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500"
                                                    aria-hidden="true"
                                                  />
                                                  Duplicate
                                                </a>
                                              )}
                                            </Menu.Item>
                                            <Menu.Item>
                                              {({ active }) => (
                                                <Link
                                                  to={`/channel/${team.id}/${channel.slug}/add-user`}
                                                  className={clsx(
                                                    active
                                                      ? 'bg-gray-100 text-gray-900'
                                                      : 'text-gray-700',
                                                    'group flex items-center px-4 py-2 text-sm'
                                                  )}
                                                >
                                                  <UserAddIcon
                                                    className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500"
                                                    aria-hidden="true"
                                                  />
                                                  Share
                                                </Link>
                                              )}
                                            </Menu.Item>
                                          </div>
                                          <div className="py-1">
                                            <Menu.Item>
                                              {({ active }) => (
                                                <Link
                                                  to={`/channel/${team.id}/${channel.slug}/delete`}
                                                  className={clsx(
                                                    active
                                                      ? 'bg-gray-100 text-gray-900'
                                                      : 'text-gray-700',
                                                    'group flex items-center px-4 py-2 text-sm'
                                                  )}
                                                >
                                                  <TrashIcon
                                                    className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500"
                                                    aria-hidden="true"
                                                  />
                                                  Delete
                                                </Link>
                                              )}
                                            </Menu.Item>
                                          </div>
                                        </Menu.Items>
                                      </Transition>
                                    </>
                                  )}
                                </Menu>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* /End replace */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
export { loader };
